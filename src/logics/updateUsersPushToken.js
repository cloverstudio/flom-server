const { logger } = require("#infra");
const { User } = require("#models");

async function updateUsersPushToken(pushToken, userId, isVoipPushToken) {
  try {
    const pushTokenFieldName = isVoipPushToken ? "voipPushToken" : "pushToken";

    await User.updateMany(
      { [pushTokenFieldName]: pushToken, _id: { $ne: userId } },
      { $pull: { [pushTokenFieldName]: pushToken } }
    );

    await User.findByIdAndUpdate(userId, { $set: { [pushTokenFieldName]: [pushToken] } });

    return;
  } catch (error) {
    logger.error("updateUsersPushToken error: ", error);
    return;
  }
}

module.exports = updateUsersPushToken;
