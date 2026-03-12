const { logger } = require("#infra");
const { Const } = require("#config");
const Utils = require("#utils");
const { FlomMessage, User } = require("#models");
const notifyUpdateMessage = require("./notifyUpdateMessage");

async function getFirstUnreadTextMessage({ senderPhoneNumber, receiverPhoneNumber }) {
  try {
    const senderUser = await User.findOne({ phoneNumber: senderPhoneNumber }).lean();
    const receiverUser = await User.findOne({ phoneNumber: receiverPhoneNumber }).lean();

    if (!senderUser || !receiverUser) {
      throw new Error("user doesn't exist!");
    }

    const chatId = Utils.chatIdByUser(senderUser, receiverUser);

    const unDeliveredMessages = await FlomMessage.find({
      roomID: chatId,
      userID: receiverUser._id.toString(),
      deliveredTo: [],
      created: { $gt: +Date.now() - 24 * 60 * 60 * 1000 },
      type: Const.messageTypeText,
    }).sort({ created: 1 });

    if (unDeliveredMessages.length === 0) {
      return "";
    }

    await FlomMessage.updateOne(
      { _id: unDeliveredMessages[0]._id },
      {
        $set: {
          deliveredTo: [{ userId: senderUser._id.toString(), at: Date.now() }],
          seenBy: [{ user: senderUser._id.toString(), at: Date.now() }],
        },
      },
    );

    notifyUpdateMessage(unDeliveredMessages[0]);

    let message = unDeliveredMessages[0].message;

    console.log({ unDeliveredMessages });
    console.log({ message });

    if (unDeliveredMessages.length > 1) {
      message += "*";
    }

    return `*${message}`;
  } catch (error) {
    logger.error("getFirstUnreadTextMessage error: ", error);
    return;
  }
}

module.exports = getFirstUnreadTextMessage;
