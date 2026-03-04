const { logger } = require("#infra");
const { Const } = require("#config");
const { Message, User } = require("#models");

async function getAllUnreadTextMessages(phoneNumber) {
  try {
    const receiverUser = await User.findOne({ phoneNumber }).lean();

    if (!receiverUser) {
      throw new Error("user doesn't exist");
    }

    const unDeliveredMessages = await Message.find({
      sentTo: receiverUser._id.toString(),
      deliveredTo: { $not: { $elemMatch: { userId: receiverUser._id.toString() } } },
      seenBy: { $not: { $elemMatch: { user: receiverUser._id.toString() } } },
      created: { $gt: +Date.now() - 24 * 60 * 60 * 1000 },
      type: Const.messageTypeText,
    })
      .sort({ created: 1 })
      .lean();

    return unDeliveredMessages;
  } catch (error) {
    logger.error("getAllUnreadTextMessages error: ", error);
    return;
  }
}

module.exports = getAllUnreadTextMessages;
