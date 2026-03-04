const { logger } = require("#infra");
const { Message, User } = require("#models");

async function markMessageDeliveredAndSeenAndNotify(message, receiverPhoneNumber) {
  try {
    const receiverUser = await User.findOne({ phoneNumber: receiverPhoneNumber }).lean();

    const deliveredTo = [
      ...message.deliveredTo,
      { userId: receiverUser._id.toString(), at: Date.now() },
    ];

    const seenBy = [...message.seenBy, { user: receiverUser._id.toString(), at: Date.now() }];

    await Message.updateOne(
      { _id: message._id },
      {
        $set: {
          deliveredTo,
          seenBy,
        },
      },
    );
  } catch (error) {
    logger.error("markMessageDeliveredAndSeenAndNotify error: ", error);
    return;
  }
}

module.exports = markMessageDeliveredAndSeenAndNotify;
