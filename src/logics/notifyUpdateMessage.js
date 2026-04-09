const { logger } = require("#infra");
const { Const, Config } = require("#config");
const { User } = require("#models");
const socketApi = require("../sockets/socket-api");

const totalUnreadCount = require("./totalUnreadCount");
const sendPush = require("./sendPush");

async function notifyUpdateMessage(message) {
  try {
    const chatType = message.roomID.split("-")[0];
    const roomIDSplitted = message.roomID.split("-");

    if (roomIDSplitted.length < 2) return;

    let fromUserId, toUserId;

    // Websocket
    if (chatType == Const.chatTypeGroup) {
      socketApi.emitToRoom(message.roomID, "updatemessages", [message]);
    } else if (chatType == Const.chatTypeRoom) {
      socketApi.emitToRoom(message.roomID, "updatemessages", [message]);
    } else if (chatType == Const.chatTypePrivate) {
      const splitAry = message.roomID.split("-");

      if (splitAry.length < 2) return;

      const user1 = splitAry[1];
      const user2 = splitAry[2];

      let toUserId = null;
      let fromUserId = null;

      if (user1 == message.userID) {
        toUserId = user2;
        fromUserId = user1;
      } else {
        toUserId = user1;
        fromUserId = user2;
      }

      socketApi.emitToRoom(fromUserId, "updatemessages", [message]);
      socketApi.emitToRoom(toUserId, "updatemessages", [message]);
    }

    const fromUser = await User.findById(fromUserId).lean();
    const toUser = await User.findById(toUserId).lean();

    const unreadCount =
      message.type == Const.messageTypeOffer ? null : await totalUnreadCount(fromUserId);

    if (message.type != Const.messageTypeOffer) return;

    const tokenAndBadgeCount = [];
    let badgeCount = 0;

    if (unreadCount) badgeCount = unreadCount;

    const mutedList = fromUser.muted ?? [];
    let isMuted = false;
    let targetId = null;

    targetId = toUserId;
    if (mutedList.includes(targetId)) isMuted = true;

    fromUser.pushToken.forEach((token) => {
      tokenAndBadgeCount.push({
        badge: badgeCount,
        token: token,
        isMuted: isMuted,
      });
    });

    if (Config.useVoipPush) {
      fromUser.voipPushToken.forEach((token) => {
        tokenAndBadgeCount.push({
          badge: badgeCount,
          token: token,
          isMuted: isMuted,
        });
      });
    }

    fromUser.webPushSubscription.forEach((subscription) => {
      tokenAndBadgeCount.push({
        badge: badgeCount,
        token: subscription,
        isMuted: isMuted,
      });
    });

    let avatarURL = "/api/v2/avatar/user/";
    if (toUser.avatar && toUser.avatar.thumbnail) avatarURL += toUser.avatar.thumbnail.nameOnServer;

    let name = "";
    if (toUser.name) name = toUser.name;

    let msg = message.message;
    if (message.type == Const.messageTypeFile) msg = " Sent file";
    if (message.type == Const.messageTypeLocation) msg = " Shared location";
    if (message.type == Const.messageTypeContact) msg = " Shared contact";
    if (message.type == Const.messageTypeSticker) msg = " Sent sticker";
    if (message.type == Const.messageTypeAudio) msg = " Sent audio";
    if (message.type == Const.messageTypeVideo) msg = " Sent video";
    if (message.type == Const.messageTypeImage) msg = " Sent image";
    if (message.type == Const.messageTypeOffer) msg = " Sent offer";

    if (message.type == Const.messageTypeReceipt) {
      if (message.attributes.transaction) {
        switch (message.attributes.transaction) {
          case Const.transactionTypeAirTime:
            msg = " Top-up received";
            break;
          case Const.transactionTypeData:
            msg = " Data received";
            break;
          case Const.transactionTypeBless:
            msg = " Bless received";
            break;
          default:
            msg = "";
            break;
        }
      }
    }

    const payload = {
      roomId: message.roomID,
      message: {
        id: message._id.toString(),
        message: message.message,
        messageiOS: name + ":" + msg,
        type: message.type,
        created: message.created,
      },
      from: {
        id: toUser._id.toString(),
        name: name,
        thumb: avatarURL,
        created: toUser.created,
        avatar: toUser.avatar,
        phoneNumber: toUser.phoneNumber,
      },
    };

    if (message.file) payload.file = message.file;
    if (message.location) payload.location = message.location;
    if (message.attributes) payload.message.attributes = message.attributes;
    if (fromUser.avatar && fromUser.avatar.thumbnail)
      avatarURL += fromUser.avatar.thumbnail.nameOnServer;

    payload.to = {
      id: fromUser._id.toString(),
      name: fromUser.name,
      thumb: avatarURL,
      created: fromUser.created,
      avatar: fromUser.avatar,
      phoneNumber: fromUser.phoneNumber,
    };

    if (
      message.attributes &&
      message.attributes.product &&
      message.attributes.product.status == 4
    ) {
      const payloadFromUser = payload.from;
      const payloadToUser = payload.to;
      payload.from = payloadToUser;
      payload.to = payloadFromUser;
    }

    payload.pushType = Const.pushTypeNewMessage;
    sendPush(tokenAndBadgeCount, payload, Config.useVoipPush);

    return;
  } catch (error) {
    logger.error("notifyUpdateMessage error: ", error);
    return;
  }
}

module.exports = notifyUpdateMessage;
