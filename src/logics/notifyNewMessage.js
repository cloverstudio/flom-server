const { logger, encryptionManager } = require("#infra");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { User, Room, Group } = require("#models");
const socketApi = require("../sockets/socket-api");

const sendPush = require("./sendPush");
const totalUnreadCount = require("./totalUnreadCount");
const populateMessages = require("./populateMessages");

async function notifyNewMessage(obj, originalRequestData) {
  try {
    const chatType = obj.roomID.split("-")[0];
    const roomIDSplitted = obj.roomID.split("-");
    const isRoomOrBroadcast =
      chatType == Const.chatTypeRoom || chatType == Const.chatTypeBroadcastAdmin;

    if (obj.roomID.includes("null")) return;
    if (roomIDSplitted.length < 2) return;

    const result = { originalRequestData: originalRequestData };

    if (chatType == Const.chatTypeGroup) {
      const group = await Group.findById(roomIDSplitted[1]).lean();
      result.group = group;
      if (group) result.organizationId = group.organizationId;
      obj.group = group;
    } else if (isRoomOrBroadcast) {
      const room = await Room.findById(roomIDSplitted[1]).lean();
      result.room = room;
      if (room) result.organizationId = room.organizationId;
      obj.room = room;

      const u = await User.findById(result.room.owner).lean();
      result.organizationId = u.organizationId;
    }

    const user = await User.findById(obj.userID, { token: 0 }).lean();
    if (!user && !obj.userID.includes(Const.botUserIdPrefix)) {
      throw new Error("invalid user id");
    }
    result.sender = user;

    if (!obj.userID.includes(Const.botUserIdPrefix)) {
      obj.user = user;
    }

    const messageCloned = JSON.parse(JSON.stringify(obj));

    if (messageCloned.type == Const.messageTypeText) {
      const encryptedMessage = encryptionManager.encryptText(messageCloned.message);
      messageCloned.message = encryptedMessage;
    }

    // websocket notification
    if (chatType == Const.chatTypeGroup) {
      const usersWhoMutedGroup = await User.find(
        { muted: result.group._id.toString() },
        { token: 0 },
      ).lean();

      messageCloned.group = result.group;
      messageCloned.mutedUsersGroupRoom = usersWhoMutedGroup.map((user) => user._id.toString());
      socketApi.flom.emitToRoom(messageCloned.roomID, "newmessage", messageCloned);
    } else if (chatType == Const.chatTypeRoom) {
      const usersWhoMutedRoom = await User.find(
        { muted: result.room._id.toString() },
        { token: 0 },
      ).lean();

      messageCloned.room = result.room;
      messageCloned.mutedUsersGroupRoom = usersWhoMutedRoom.map((user) => user._id.toString());
      socketApi.flom.emitToRoom(messageCloned.roomID, "newmessage", messageCloned);
    } else if (chatType == Const.chatTypePrivate) {
      const splitAry = messageCloned.roomID.split("-");
      if (splitAry.length < 2) return;

      let user1 = splitAry[1];
      let user2 = splitAry[2];
      let toUser = null;
      let fromUser = null;

      if (user1 == obj.userID) {
        toUser = user2;
        fromUser = user1;
      } else {
        toUser = user1;
        fromUser = user2;
      }
      let muteNotification = false;
      result.toUserId = toUser;

      let toUserObj = await User.findById(result.toUserId, { token: 0 }).lean();

      result.users = toUserObj ? [toUserObj] : [];

      if (!toUserObj) return;

      result.organizationId = toUserObj.organizationId;

      if (result.sender && Array.isArray(toUserObj.muted)) {
        if (toUserObj.muted.indexOf(result.sender._id.toString()) != -1) muteNotification = true;
      }

      // send to my Base
      socketApi.flom.emitToRoom(fromUser, "newmessage", messageCloned);

      // send to user who got message
      socketApi.flom.emitToRoom(toUser, "newmessage", messageCloned);
    }

    if (chatType == Const.chatTypeBroadcastAdmin) {
      const usersToNotify = await User.find({
        $and: [
          { lastActive: { $exists: true } },
          { lastActive: { $gt: Date.now() - Const.dayInMs * 60 } },
          { "isDeleted.value": false },
          { muted: { $nin: [result.room._id.toString()] } },
          { _id: { $ne: result.room.owner } },
        ],
      }).lean();

      const flomAgent = await User.findById(Config.flomSupportAgentId).lean();
      socketApi.flom.emitToRoom(flomAgent, "newmessage", messageCloned);

      for (const user of usersToNotify) {
        await Utils.wait(0.2);

        await Utils.sendFlomPush({
          newUser: flomAgent,
          receiverUser: user,
          message: obj.message,
          messageiOs: obj.message,
          pushType: Const.pushTypeNewAdminBroadcastMessage,
          roomId: `5-${result.room._id.toString()}`,
          isMuted: true,
        });
      }
    }

    // start sending push notification
    let msg = "";

    if (chatType == Const.chatTypeGroup) {
      if (result.sender) {
        msg = result.sender.name + " posted new message to " + obj.group.name;
      } else {
        msg = "New message to " + obj.group.name;
      }

      const groupUsers = await User.find(
        { $and: [{ _id: { $in: obj.group.users } }, { _id: { $ne: obj.userID } }] },
        { token: 0 },
      ).lean();

      result.users = groupUsers;
      result.pushMessage = msg;
    } else if (isRoomOrBroadcast) {
      if (result.sender) {
        msg = result.sender.name + " posted new message to " + obj.room.name;
      } else {
        msg = "New message to " + obj.room.name;
      }

      const roomUsers = await User.find(
        { $and: [{ _id: { $in: obj.room.users } }, { _id: { $ne: obj.userID } }] },
        { token: 0 },
      ).lean();

      result.users = roomUsers;
      result.pushMessage = msg;
    } else if (chatType == Const.chatTypePrivate) {
      if (result.sender) {
        msg = result.sender.name + ": " + obj.message;
      } else {
        msg = " New message: " + obj.message;
      }

      result.pushMessage = msg;
    }

    result.offlineUsers = result.users;

    const tokenAndBadgeCount = [];
    for (const user of result.offlineUsers) {
      const count = await totalUnreadCount(user._id.toString());

      const badgeCount = count || 0;
      const mutedList = user.muted || [];
      let isMuted = false;
      let targetId = null;

      if (chatType == Const.chatTypeGroup) {
        targetId = obj.group._id.toString();
      } else if (isRoomOrBroadcast) {
        targetId = obj.room._id.toString();
      } else {
        targetId = obj.user._id.toString();
      }

      isMuted = mutedList.includes(targetId);

      user.pushToken.forEach(function (token) {
        tokenAndBadgeCount.push({
          badge: badgeCount,
          token: token,
          isMuted: isMuted,
        });
      });

      if (Config.useVoipPush) {
        user.voipPushToken.forEach(function (token) {
          tokenAndBadgeCount.push({
            badge: badgeCount,
            token: token,
            isMuted: isMuted,
          });
        });
      }

      user.webPushSubscription.forEach(function (subscription) {
        tokenAndBadgeCount.push({
          badge: badgeCount,
          token: subscription,
          isMuted: isMuted,
        });
      });
    }

    const uuid = result.sender.UUID.find((uuid) => uuid.UUID == originalRequestData.UUID);
    let senderPushTokens = [];
    let senderVoipPushTokens = [];

    if (uuid) {
      senderPushTokens = result.sender.pushToken.filter((pt) => !uuid.pushTokens.includes(pt));
      senderVoipPushTokens = result.sender.voipPushToken.filter(
        (pt) => !uuid.pushTokens.includes(pt),
      );
    } else {
      senderPushTokens = result.sender.pushToken;
      senderVoipPushTokens = result.sender.voipPushToken;
    }

    if (Config.useVoipPush) {
      senderVoipPushTokens.forEach((token) => {
        tokenAndBadgeCount.push({
          badge: 0,
          token: token,
          isMuted: false,
          isSender: true,
        });
      });
    }

    senderPushTokens.forEach((token) => {
      tokenAndBadgeCount.push({
        badge: 0,
        token: token,
        isMuted: false,
        isSender: true,
      });
    });

    const newData = await populateMessages([obj], null, null);
    if (newData && newData.length > 0) {
      result.message = newData[0];
    }

    // send push token notifications

    let avatarURL = "/api/v2/avatar/user/";
    if (obj.user && obj.user.avatar && obj.user.avatar.thumbnail)
      avatarURL += obj.user.avatar.thumbnail.nameOnServer;

    let name = "";
    if (obj.user && obj.user.name) name = obj.user.name;

    let message = obj.message;
    if (obj.type == Const.messageTypeFile) message = " Sent file";
    if (obj.type == Const.messageTypeLocation) message = " Shared location";
    if (obj.type == Const.messageTypeContact) message = " Shared contact";
    if (obj.type == Const.messageTypeSticker) message = " Sent sticker";
    if (obj.type == Const.messageTypeAudio) message = " Sent audio";
    if (obj.type == Const.messageTypeVideo) message = " Sent video";
    if (obj.type == Const.messageTypeImage) message = " Sent image";

    const payload = {
      roomId: obj.roomID,
      message: {
        id: obj._id.toString(),
        message: obj.message,
        messageiOS: name + ":" + message,
        type: obj.type,
        created: obj.created,
        receiverPhoneNumber: obj.receiverPhoneNumber || null,
        receiverName: obj.receiverName || null,
        senderPhoneNumber: obj.senderPhoneNumber || null,
        senderName: obj.senderName || null,
      },
      from: {
        id: obj.userID,
        name: name,
        thumb: avatarURL,
        created: obj.user.created,
        avatar: obj.user.avatar,
        phoneNumber: obj.user.phoneNumber,
      },
    };

    if (obj.file) payload.file = obj.file;
    if (obj.location) payload.location = obj.location;
    if (obj.attributes) payload.message.attributes = obj.attributes;
    if (obj.group) {
      let avatarURL = "/api/v2/avatar/group/";

      if (obj.group.avatar && obj.group.avatar.thumbnail)
        avatarURL += obj.group.avatar.thumbnail.nameOnServer;

      payload.group = {
        id: obj.group._id.toString(),
        name: obj.group.name,
        thumb: avatarURL,
        created: obj.group.created,
      };
      payload.message.messageiOS = obj.group.name + " - " + payload.message.messageiOS;
    }

    if (obj.room) {
      let avatarURL = "/api/v2/avatar/room/";
      let avatar = null;

      if (obj.room.avatar && obj.room.avatar.thumbnail) {
        avatarURL += obj.room.avatar.thumbnail.nameOnServer;
        avatar = obj.room.avatar;
      }

      payload.room = {
        id: obj.room._id.toString(),
        name: obj.room.name,
        thumb: avatarURL,
        created: obj.room.created,
        owner: obj.room.owner,
        ...(avatar && { avatar }),
      };

      payload.message.messageiOS = obj.room.name + " - " + payload.message.messageiOS;
    }

    const receiver = result.users[0];
    avatarURL = "/api/v2/avatar/user/";

    if (receiver && receiver.avatar && receiver.avatar.thumbnail)
      avatarURL += receiver.avatar.thumbnail.nameOnServer;

    payload.to = {
      id: receiver?._id.toString(),
      name: receiver?.name,
      thumb: avatarURL,
      created: receiver?.created,
      avatar: receiver?.avatar,
      phoneNumber: receiver?.phoneNumber,
    };

    if (obj.type == Const.messageTypeProduct) {
      payload.pushType = Const.pushTypeProduct;
    } else if (obj.type == Const.messageTypeShop) {
      payload.pushType = Const.pushTypeShop;
    } else {
      payload.pushType = Const.pushTypeNewMessage;
    }
    payload.undeliveredCount = originalRequestData.undeliveredCount;
    payload.isHighPriority = true;
    sendPush(tokenAndBadgeCount, payload, Config.useVoipPush);

    return result;
  } catch (error) {
    logger.error("notifyNewMessage error: ", error);
    throw new Error(error.message);
  }
}

module.exports = notifyNewMessage;
