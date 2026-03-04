const { logger } = require("#infra");
const { Const } = require("#config");
const Utils = require("#utils");
const { User, History, Group, Room } = require("#models");

const totalUnreadCount = require("./totalUnreadCount");
const getUsersOnlineStatus = require("./getUsersOnlineStatus");

async function searchHistory(lastUpdate, page, keyword, baseUser, pagingRows) {
  try {
    const user = baseUser;

    const result = {};

    const historyQuery = { userId: user._id.toString() };
    const historyOptions = { lean: true, sort: { pinned: "desc", lastUpdate: "desc" } };

    if (lastUpdate > 0) {
      historyQuery.$or = [
        { lastUpdate: { $gt: lastUpdate } },
        { lastUpdateUnreadCount: { $gt: lastUpdate } },
      ];
    } else {
      if (keyword) {
        historyQuery.keyword = new RegExp("^.*" + Utils.escapeRegExp(keyword) + ".*$", "i");
      }

      if (!page || page < 1) page = 0;

      historyOptions.skip = pagingRows * page;
      historyOptions.limit = pagingRows;
    }

    const histories = await History.find(historyQuery, null, historyOptions);
    result.list = histories;
    const historyCount = await History.countDocuments(historyQuery);
    result.count = historyCount;

    if (histories.length > 100) console.log(lastUpdate, histories[100]);

    const userIds = histories
      .filter((h) => h.chatType == Const.chatTypePrivate && Utils.isObjectId(h.chatId))
      .map((h) => h.chatId);

    const users = await User.find({ _id: { $in: userIds } }, null, { lean: true });
    const userMap = {};
    users.forEach((u) => {
      userMap[u._id.toString()] = u;
    });

    result.list.forEach((history) => {
      if (history.chatType == Const.chatTypePrivate) {
        history.user = userMap[history.chatId];
      }
    });
    result.list = result.list.filter(
      (h) => h.user !== undefined || h.chatType != Const.chatTypePrivate
    );

    const groupIds = histories
      .filter((h) => h.chatType == Const.chatTypeGroup)
      .map((h) => h.chatId);

    const groups = await Group.find({ _id: { $in: groupIds } }, null, { lean: true });
    const groupMap = {};
    groups.forEach((g) => {
      groupMap[g._id.toString()] = g;
    });

    result.list.forEach((history) => {
      if (history.chatType == Const.chatTypeGroup) {
        history.group = groupMap[history.chatId];
      }
    });
    result.list = result.list.filter(
      (h) => h.group !== undefined || h.chatType != Const.chatTypeGroup
    );

    const roomIds = histories.filter((h) => h.chatType == Const.chatTypeRoom).map((h) => h.chatId);

    const rooms = await Room.find({ _id: { $in: roomIds } }, null, { lean: true });
    const roomMap = {};
    rooms.forEach((r) => {
      roomMap[r._id.toString()] = r;
    });

    result.list.forEach((history) => {
      if (history.chatType == Const.chatTypeRoom) {
        history.room = roomMap[history.chatId];
      }
    });
    result.list = result.list.filter(
      (h) => h.room !== undefined || h.chatType != Const.chatTypeRoom
    );

    let userIdsFromGroup = [];
    result.list.forEach((history) => {
      if (history.chatType == Const.chatTypeGroup && history.group) {
        userIdsFromGroup = userIdsFromGroup.concat(history.group.userIds.slice(0, 4));
      }
    });

    let userIdsFromRoom = [];
    result.list.forEach((history) => {
      if (history.chatType == Const.chatTypeRoom && history.room) {
        userIdsFromRoom = userIdsFromRoom.concat(history.room.userIds.slice(0, 4));
      }
    });

    const additionalUserIds = Array.from(new Set([...userIdsFromGroup, ...userIdsFromRoom]));
    const additionalUsers = await User.find(
      { _id: { $in: additionalUserIds } },
      User.getDefaultResponseFields(),
      { lean: true }
    );
    const additionalUserMap = {};
    additionalUsers.forEach((u) => {
      additionalUserMap[u._id.toString()] = u;
    });

    result.list.forEach((history) => {
      if (history.chatType == Const.chatTypeGroup && history.group) {
        history.group.usersCount = history.group.userIds.length;
        history.group.userModels = history.group.userIds
          .slice(0, 4)
          .map((uid) => additionalUserMap[uid])
          .filter((u) => u !== undefined);
      } else if (history.chatType == Const.chatTypeRoom && history.room) {
        history.room.usersCount = history.room.userIds.length;
        history.room.ownerModel = additionalUserMap[history.room.owner];
        history.room.userModels = history.room.userIds
          .slice(0, 4)
          .map((uid) => additionalUserMap[uid])
          .filter((u) => u !== undefined);
      }
    });

    result.totalUnreadCount = await totalUnreadCount(user._id.toString());
    const onlineStatuses = await getUsersOnlineStatus(userIds);
    result.list.forEach((history) => {
      if (history.user) {
        const onlineStatusObj = onlineStatuses.find(
          (os) => os.userId.toString() === history.user._id.toString()
        );
        history.user.onlineStatus = !onlineStatusObj ? 0 : onlineStatusObj.onlineStatus;
      }
    });

    return result;
  } catch (error) {
    logger.error("searchHistory error: ", error);
    return;
  }
}

module.exports = searchHistory;
