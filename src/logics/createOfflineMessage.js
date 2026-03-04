const { logger } = require("#infra");
const { Const } = require("#config");
const Utils = require("#utils");
const { OfflineMessage, User } = require("#models");

const createNewUser = require("./createNewUser");

async function createOfflineMessage({ senderPhoneNumber, receiverPhoneNumber, sessionId }) {
  try {
    let senderUserIsNew = false;
    let receiverUserIsNew = false;

    let senderUser = await User.findOne({ phoneNumber: senderPhoneNumber }).lean();

    if (!senderUser) {
      const senderUserData = {
        phoneNumber: senderPhoneNumber,
        isAppUser: true,
        typeAcc: 2,
        shadow: true,
      };
      senderUser = await createNewUser(senderUserData);
      senderUserIsNew = true;
    }

    let receiverUser = await User.findOne({ phoneNumber: receiverPhoneNumber }).lean();

    if (!receiverUser) {
      const receiverUserData = {
        phoneNumber: receiverPhoneNumber,
        ref: senderUser._id.toString(),
        isAppUser: true,
        typeAcc: 2,
        shadow: true,
      };
      receiverUser = await createNewUser(receiverUserData);
      receiverUserIsNew = true;
    }

    const chatId = Utils.chatIdByUser(senderUser, receiverUser);

    const offlineMessageData = {
      roomID: chatId,
      userID: senderUser._id.toString(),
      userPhoneNumber: senderUser.phoneNumber,
      receiverID: receiverUser._id.toString(),
      receiverPhoneNumber: receiverUser.phoneNumber,
      type: Const.messageTypeText,
      sessionId,
      senderUserIsNew,
      receiverUserIsNew,
    };

    const offlineMessage = await OfflineMessage.create(offlineMessageData);

    return offlineMessage.toObject();
  } catch (error) {
    logger.error("createOfflineMessage error: ", error);
    return;
  }
}

module.exports = createOfflineMessage;
