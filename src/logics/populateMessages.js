const { logger } = require("#infra");
const { Const } = require("#config");
const Utils = require("#utils");
const { User, Room, Group } = require("#models");

async function populateMessage(messageList, callerUser) {
  try {
    if (!messageList || !Array.isArray(messageList) || messageList.length === 0) {
      throw new Error("messageList missing: " + messageList);
    }

    const userIds = new Set();
    const groupIds = new Set();
    const roomIds = new Set();

    messageList.forEach((m) => {
      if (Utils.isObjectId(m.userID)) userIds.add(m.userID);

      const regex = new RegExp("^" + Const.chatTypeGroup + "-");
      if (regex.test(m.roomID)) {
        const groupId = Utils.getObjectIdFromRoomID(m.roomID);
        if (groupId && Utils.isObjectId(groupId)) groupIds.add(groupId);
      }

      if (
        m.roomID &&
        (m.roomID.startsWith(Const.chatTypeRoom + "-") ||
          m.roomID.startsWith(Const.chatTypeBroadcastAdmin + "-"))
      ) {
        const roomId = Utils.getObjectIdFromRoomID(m.roomID);
        if (roomId && Utils.isObjectId(roomId)) roomIds.add(roomId);
      }

      const roomId = m.roomID;
      const temp = roomId.split("-");

      if (temp[0] == Const.chatTypePrivate) {
        if (temp.length > 2) {
          if (Utils.isObjectId(temp[1])) userIds.add(temp[1]);
          if (Utils.isObjectId(temp[2])) userIds.add(temp[2]);
        }
      }
    });

    const users = await User.find({ _id: { $in: Array.from(userIds) } }).lean();
    const groups = await Group.find({ _id: { $in: Array.from(groupIds) } }).lean();
    const rooms = await Room.find({ _id: { $in: Array.from(roomIds) } }).lean();

    const newMessageList = messageList.map((m) => {
      m.user = users.find((user) => user._id.toString() == m.userID);

      const roomType = m.roomID.split("-")[0];

      if (roomType == Const.chatTypePrivate) {
        const roomIDSplitted = m.roomID.split("-");

        if (roomIDSplitted.length > 2) {
          const user1 = roomIDSplitted[1];
          const user2 = roomIDSplitted[2];

          const targetUserId = user1;
          if (callerUser) {
            if (callerUser._id == user1) targetUserId = user2;
          } else {
            callerUser = m.userID;
          }

          m.userModelTarget = users.find((user) => user._id.toString() == targetUserId);
        }
      }

      if (roomType == Const.chatTypeGroup) {
        m.group = groups.find((g) => g._id.toString() == Utils.getObjectIdFromRoomID(m.roomID));
      }

      if (roomType == Const.chatTypeRoom || roomType == Const.chatTypeBroadcastAdmin) {
        m.room = rooms.find((r) => r._id.toString() == Utils.getObjectIdFromRoomID(m.roomID));
      }

      return m;
    });

    return newMessageList;
  } catch (error) {
    logger.error("populateMessage error: ", error);
    return;
  }
}

module.exports = populateMessage;
