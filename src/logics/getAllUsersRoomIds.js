const { logger } = require("#infra");
const { Message, User } = require("#models");

async function getAllUsersRoomIds(phoneNumber) {
  try {
    const receiverUser = await User.findOne({ phoneNumber }).lean();

    if (!receiverUser) {
      throw new Error("user doesn't exist");
    }

    const messages = await Message.aggregate([
      {
        $match: {
          sentTo: receiverUser._id.toString(),
          roomID: { $not: /^1/ },
        },
      },
      {
        $project: {
          roomID: 1,
          _id: 0,
        },
      },
      {
        $group: {
          _id: "$roomID",
        },
      },
    ]);

    return messages.map((m) => m._id.toString());
  } catch (error) {
    logger.error("getAllUsersRoomIds error: ", error);
    return;
  }
}

module.exports = getAllUsersRoomIds;
