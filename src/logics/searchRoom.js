const { logger } = require("#infra");
const { Const } = require("#config");
const Utils = require("#utils");
const { Room } = require("#models");

async function searchRoom(baseUser, keyword, page) {
  try {
    const result = {};

    const user = baseUser;
    const userId = user._id.toString();

    const conditions = { users: userId };

    if (keyword) {
      conditions["$or"] = [
        { name: new RegExp("^.*" + Utils.escapeRegExp(keyword) + ".*$", "i") },
        { description: new RegExp("^.*" + Utils.escapeRegExp(keyword) + ".*$", "i") },
      ];
    }

    const rooms = Room.find(conditions)
      .skip(Const.pagingRows * page)
      .sort({ sortName: "asc" })
      .limit(Const.pagingRows)
      .lean();
    result.list = rooms;

    const count = await Room.countDocuments(conditions);
    result.count = count;

    return result;
  } catch (error) {
    logger.error("searchRoom error: ", error);
    return;
  }
}

module.exports = searchRoom;
