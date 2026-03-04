const { logger } = require("#infra");
const { Const } = require("#config");
const { OfflineMessage, User } = require("#models");

const createNewUser = require("./createNewUser");

async function createOfflineGroupMessage({ senderPhoneNumber, roomID, sessionId }) {
  try {
    let senderUserIsNew = false;
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

    const offlineMessageData = {
      roomID,
      userID: senderUser._id.toString(),
      userPhoneNumber: senderUser.phoneNumber,
      type: Const.messageTypeText,
      sessionId,
      senderUserIsNew,
    };

    const offlineMessage = await OfflineMessage.create(offlineMessageData);

    return offlineMessage.toObject();
  } catch (error) {
    logger.error("createOfflineGroupMessage error: ", error);
    return;
  }
}

module.exports = createOfflineGroupMessage;
