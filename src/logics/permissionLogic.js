const { logger } = require("#infra");
const { Const } = require("#config");
const { Group, User, Room } = require("#models");

async function getGroupsJoined(userId) {
  try {
    let groups = [];

    const user = await User.findById(userId).lean();
    groups = groups.concat(user.groups);

    const deps = await getDepartments(userId);
    groups = groups.concat(deps);

    return groups;
  } catch (error) {
    logger.error("getGroupsJoined error: ", error);
    return [];
  }
}

async function getRoomsJoined(userId) {
  try {
    const rooms = Room.find({ users: userId }).lean();
    const roomIds = rooms.map((r) => r._id.toString());

    return roomIds;
  } catch (error) {
    logger.error("getRoomsJoined error: ", error);
    return [];
  }
}

async function getDepartments(userId) {
  try {
    const user = await User.findById(userId).lean();
    const userGroups = user.groups ?? [];
    if (userGroups.length === 0) return [];

    const groups = await Group.find({
      organizationId: user.organizationId,
      type: Const.groupType.department,
    }).lean();
    const groupIds = groups.map((g) => g._id.toString());

    const departmentIds = new Set();
    userGroups.forEach((ug) => {
      if (groupIds.includes(ug)) {
        departmentIds.add(ug);
      }
    });

    return Array.from(departmentIds);
  } catch (error) {
    logger.error("getDepartments error: ", error);
    return [];
  }
}

async function checkPermissionByChatId(userId, chatId) {
  try {
    const messageTargetTypeAry = chatId.split("-");
    if (messageTargetTypeAry.length < 2) {
      throw new Error("invalid room id");
    }

    const messageTargetType = messageTargetTypeAry[0];
    const messageTargetId = messageTargetTypeAry[1];

    if (messageTargetType == Const.chatTypeGroup) {
      const group = await Group.findById(messageTargetId).lean();

      if (!group) {
        throw new Error("invalid group id");
      }

      if (!group.users.includes(userId)) {
        throw new Error("no permission");
      }
    } else if (
      messageTargetType == Const.chatTypeRoom ||
      messageTargetType == Const.chatTypeBroadcastAdmin
    ) {
      this.checkRoomPermission(userId, messageTargetId, errorCB, cb);

      const room = await Room.findById(messageTargetId).lean();

      if (!room) {
        throw new Error("invalid room id");
      }

      if (room.type != Const.chatTypeBroadcastAdmin) {
        if (room.ownerRemoved) {
          throw new Error("room owner removed");
        }

        if (!room.users.includes(userId)) {
          throw new Error("no permission");
        }
      }
    }

    return;
  } catch (error) {
    logger.error("checkPermissionByChatId error: ", error);
    throw new Error(error.message);
  }
}

module.exports = {
  getGroupsJoined,
  getRoomsJoined,
  getDepartments,
  checkPermissionByChatId,
};
