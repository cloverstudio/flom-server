// .js

const { logger } = require("#infra");
const { Const } = require("#config");
const { User, Room, Group, History } = require("#models");

function isFile(messageType) {
  return (
    messageType == Const.messageTypeFile ||
    messageType == Const.messageTypeAudio ||
    messageType == Const.messageTypeVideo ||
    messageType == Const.messageTypeImage
  );
}

async function resetUnreadCount(obj) {
  try {
    const rawRoomId = obj.roomID;
    const userId = obj.userID;

    if (!rawRoomId || !userId) return;

    const roomIdSplitted = rawRoomId.split("-");
    const roomType = roomIdSplitted[0];

    let chatId = "";

    // private chat
    if (roomType == Const.chatTypePrivate) {
      if (roomIdSplitted.length != 3) return;

      // roomId = 1-user1-user2 user1: which has lower created timestamp

      const user1 = roomIdSplitted[1];
      const user2 = roomIdSplitted[2];
      chatId = user1 == userId ? user2 : user1;
    }

    // group chat
    if (roomType == Const.chatTypeGroup) {
      if (roomIdSplitted.length != 2) return;
      chatId = roomIdSplitted[1];
    }

    // room chat
    if (roomType == Const.chatTypeRoom || roomType == Const.chatTypeBroadcastAdmin) {
      if (roomIdSplitted.length != 2) return;
      chatId = roomIdSplitted[1];
    }

    await History.updateOne(
      { userId, chatId },
      { unreadCount: 0, lastUpdateUnreadCount: Date.now() },
    );

    return;
  } catch (error) {
    logger.error("resetUnreadCount error: ", error);
    return;
  }
}

async function newRoom(roomObj) {
  try {
    if (!roomObj.users || !roomObj._id) return;

    for (const userId of roomObj.users) {
      const historyObj = {
        userId: userId,
        chatId: roomObj._id,
        chatType:
          roomObj.type == Const.chatTypeBroadcastAdmin
            ? Const.chatTypeBroadcastAdmin
            : Const.chatTypeRoom,
        lastUpdate: Date.now(),
        lastUpdateUser: null,
        lastMessage: null,
        keyword: roomObj.name,
      };

      await updateData(historyObj);
    }

    return;
  } catch (error) {
    logger.error("newRoom error: ", error);
    return;
  }
}

async function updateByMessage(obj) {
  try {
    const rawRoomId = obj.roomID;
    const userId = obj.userID;
    const messageId = obj._id;

    if (!rawRoomId || !userId || !messageId) return;

    const roomIdSplitted = rawRoomId.split("-");
    const roomType = roomIdSplitted[0];

    // private chat
    if (roomType == Const.chatTypePrivate) {
      if (roomIdSplitted.length != 3) return;

      // roomId = 1-user1-user2 user1: which has lower created timestamp

      const user1 = roomIdSplitted[1];
      const user2 = roomIdSplitted[2];
      const toUserId = user1 == userId ? user2 : user1;

      await updateByPrivateChat(userId, toUserId, obj);
    }

    // group chat
    if (roomType == Const.chatTypeGroup) {
      if (roomIdSplitted.length != 2) return;

      const groupId = roomIdSplitted[1];
      const fromUserId = userId;

      await updateByGroupChat(fromUserId, groupId, obj);
    }

    // room chat
    if (roomType == Const.chatTypeRoom || roomType == Const.chatTypeBroadcastAdmin) {
      if (roomIdSplitted.length != 2) return;

      const roomId = roomIdSplitted[1];
      const fromUserId = userId;

      await updateByRoomChat(fromUserId, roomId, obj);
    }

    return;
  } catch (error) {
    logger.error("updateByMessage error: ", error);
    return;
  }
}

async function updateByPrivateChat(fromUserId, toUserId, rawMessageObj) {
  try {
    const message = {
      messageId: rawMessageObj._id.toString(),
      message: rawMessageObj.message,
      created: rawMessageObj.created,
      type: rawMessageObj.type,
      sentTo: rawMessageObj.sentTo,
    };

    if (isFile(rawMessageObj.type)) {
      message.mimeType = rawMessageObj.file.file.mimeType;
      message.size = rawMessageObj.file.file.size;

      if (rawMessageObj.file.file.duration) message.duration = rawMessageObj.file.file.duration;
    }

    const fromUser = await User.findById(fromUserId, User.getDefaultResponseFields()).lean();
    const toUser = await User.findById(toUserId, User.getDefaultResponseFields()).lean();

    let msg = message.message;
    if (msg) msg = msg.substr(0, 30);
    else msg = "";

    const historyData = {
      userId: fromUserId,
      chatId: toUserId,
      chatType: Const.chatTypePrivate,
      lastUpdate: Date.now(),
      lastUpdateUser: fromUser,
      lastMessage: message,
      keyword: toUser.name + ", " + msg,
    };

    await updateData(historyData, rawMessageObj);

    historyData.userId = toUserId;
    historyData.chatId = fromUserId;
    historyData.keyword = fromUser.name + ", " + msg;

    await updateData(historyData, rawMessageObj);

    return;
  } catch (error) {
    logger.error("updateByPrivateChat error: ", error);
    return;
  }
}

async function updateByRoomChat(fromUserId, roomId, rawMessageObj) {
  try {
    const message = {
      messageId: rawMessageObj._id.toString(),
      message: rawMessageObj.message,
      created: rawMessageObj.created,
      type: rawMessageObj.type,
      sentTo: rawMessageObj.sentTo,
    };

    if (isFile(rawMessageObj.type)) {
      message.mimeType = rawMessageObj.file.file.mimeType;
      message.size = rawMessageObj.file.file.size;

      if (rawMessageObj.file.file.duration) message.duration = rawMessageObj.file.file.duration;
    }

    const room = await Room.findById(roomId).lean();

    if (!room || !room.users || !room.users.length) {
      logger.error("updateByRoomChat error: Room not found or has no users: " + room.users);
      return;
    }

    const fromUser = await User.findById(fromUserId, User.getDefaultResponseFields()).lean();

    for (const userId of room.users) {
      let msg = message.message;
      if (msg) msg = msg.substr(0, 30);
      else msg = "";

      const historyData = {
        userId: userId,
        chatId: roomId,
        chatType:
          room.type == Const.chatTypeBroadcastAdmin
            ? Const.chatTypeBroadcastAdmin
            : Const.chatTypeRoom,
        lastUpdate: Date.now(),
        isUnread: 1,
        lastUpdateUser: fromUser,
        lastMessage: message,
        keyword: room.name + ", " + msg,
      };

      await updateData(historyData, rawMessageObj);
    }

    return;
  } catch (error) {
    logger.error("updateByRoomChat error: ", error);
    return;
  }
}

async function updateByGroupChat(fromUserId, groupId, rawMessageObj) {
  try {
    const message = {
      messageId: rawMessageObj._id.toString(),
      message: rawMessageObj.message,
      created: rawMessageObj.created,
      type: rawMessageObj.type,
      sentTo: rawMessageObj.sentTo,
    };

    if (isFile(rawMessageObj.type)) {
      message.mimeType = rawMessageObj.file.file.mimeType;
      message.size = rawMessageObj.file.file.size;

      if (rawMessageObj.file.file.duration) message.duration = rawMessageObj.file.file.duration;
    }

    const group = await Group.findById(groupId).lean();

    if (!group || !group.users || !group.users.length) {
      logger.error("updateByGroupChat error: Group not found or has no users: " + group.users);
      return;
    }

    const fromUser = await User.findById(fromUserId, User.getDefaultResponseFields()).lean();

    for (const userId of group.users) {
      let msg = message.message;
      if (msg) msg = msg.substr(0, 30);
      else msg = "";

      const historyData = {
        userId: userId,
        chatId: groupId,
        chatType: Const.chatTypeGroup,
        lastUpdate: Date.now(),
        isUnread: 1,
        lastUpdateUser: fromUser,
        lastMessage: message,
        keyword: group.name + ", " + msg,
      };

      await updateData(historyData, rawMessageObj);
    }

    return;
  } catch (error) {
    logger.error("updateByGroupChat error: ", error);
    return;
  }
}

async function updateLastMessageStatus(obj) {
  try {
    const updateParams = {};

    if (obj.delivered) updateParams["lastMessage.delivered"] = true;
    if (obj.seen) updateParams["lastMessage.seen"] = true;
    const messageIds =
      !obj.messageIds || obj.messageIds.length === 0 ? [obj.messageId] : obj.messageIds;

    await History.updateMany({ "lastMessage.messageId": { $in: messageIds } }, updateParams);

    return;
  } catch (error) {
    logger.error("updateLastMessageStatus error: ", error);
    return;
  }
}

async function updateData(data, rawMessageObj) {
  try {
    if (!data.userId || !data.chatId) return null;

    const existingData = await History.findOne({ userId: data.userId, chatId: data.chatId }).lean();

    if (rawMessageObj) {
      if (rawMessageObj?.type === Const.messageTypeCall) {
        data.lastMessage.callLogData = rawMessageObj.attributes.callLogData;
      }

      if (
        !existingData ||
        existingData.unreadCount == undefined ||
        existingData.unreadCount == null
      ) {
        data.unreadCount = 1;
      } else if (rawMessageObj && data.userId != rawMessageObj.userID) {
        data.unreadCount = existingData.unreadCount + 1;
      }

      if (rawMessageObj.type == Const.messageTypeCall) {
        const callStatus = rawMessageObj.attributes.callLogData.callStatus;
        const callerUserId = rawMessageObj.attributes.callLogData.callerUserId;

        if (callStatus === 1 || callStatus === 4) {
          data.unreadCount -= 1;
        } else if (data.userId === callerUserId) {
          data.unreadCount -= 1;
        }
      }
    }

    if (!data.unreadCount) {
      data.unreadCount = 0;
    }

    let result;
    if (existingData) {
      result = await History.findByIdAndUpdate(existingData._id.toString(), data, {
        new: true,
        lean: true,
      });
    } else {
      //When recent model is being created for the first time a new parameter should be added to recent model.
      //Parameter name should be: firstMessageUserId

      if (data.chatType === Const.chatTypePrivate)
        data.firstMessageUserId = data.lastUpdateUser._id.toString();

      if (!!rawMessageObj.wamId) data.channel = "whatsapp";
      else data.channel = "internal";

      result = await History.create(data);
      result = result.toObject();
    }

    return result;
  } catch (error) {
    logger.error("updateData error: ", error);
    return;
  }
}

module.exports = {
  resetUnreadCount,
  newRoom,
  updateByMessage,
  updateByPrivateChat,
  updateByRoomChat,
  updateByGroupChat,
  updateLastMessageStatus,
};
