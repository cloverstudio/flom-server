const { logger } = require("#infra");
const Utils = require("#utils");
const { FlomMessage } = require("#models");

const permissionLogic = require("./permissionLogic");
const populateMessages = require("./populateMessages");

async function searchMessage(baseUser, keyword, page, pagingRows) {
  try {
    const regexMessage = RegExp("^.*" + Utils.escapeRegExp(keyword || "") + ".*$", "mi");

    const result = { messages: [], count: 0 };

    const groups = await permissionLogic.getGroupsJoined(baseUser._id.toString());
    result.groups = groups || [];
    const rooms = await permissionLogic.getRoomsJoined(baseUser._id.toString());
    result.rooms = rooms || [];

    const regexUserId = RegExp("^1.+" + baseUser._id.toString(), "i");

    const privateMessages = await FlomMessage.find({
      roomID: { $regex: regexUserId },
      $or: [{ message: { $regex: regexMessage } }, { "file.file.name": { $regex: regexMessage } }],
    })
      .limit(pagingRows)
      .skip(pagingRows * page)
      .lean();

    result.messages = result.messages.concat(privateMessages);
    result.count +=
      (await FlomMessage.countDocuments({
        roomID: { $regex: regexUserId },
        $or: [
          { message: { $regex: regexMessage } },
          { "file.file.name": { $regex: regexMessage } },
        ],
      })) || 0;

    const groupRoomIds = result.groups.map((groupId) => "2-" + groupId);
    const groupMessages = await FlomMessage.find({
      roomID: { $in: groupRoomIds },
      $or: [{ message: { $regex: regexMessage } }, { "file.file.name": { $regex: regexMessage } }],
    })
      .limit(pagingRows)
      .skip(pagingRows * page)
      .lean();
    result.messages = result.messages.concat(groupMessages);
    result.count +=
      (await FlomMessage.countDocuments({
        roomID: { $in: groupRoomIds },
        $or: [
          { message: { $regex: regexMessage } },
          { "file.file.name": { $regex: regexMessage } },
        ],
      })) || 0;

    const roomRoomIds = result.groups.map((roomId) => "3-" + roomId);
    const roomMessages = await FlomMessage.find({
      roomID: { $in: roomRoomIds },
      $or: [{ message: { $regex: regexMessage } }, { "file.file.name": { $regex: regexMessage } }],
    })
      .limit(pagingRows)
      .skip(pagingRows * page)
      .lean();
    result.messages = result.messages.concat(roomMessages);
    result.count +=
      (await FlomMessage.countDocuments({
        roomID: { $in: roomRoomIds },
        $or: [
          { message: { $regex: regexMessage } },
          { "file.file.name": { $regex: regexMessage } },
        ],
      })) || 0;

    const newData = await populateMessages(result.messages, baseUser);
    result.messages = newData;

    return result;
  } catch (error) {
    logger.error("searchMessage error: ", error);
    return;
  }
}

module.exports = searchMessage;
