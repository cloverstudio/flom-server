const { logger } = require("#infra");
const callPushService = require("./callPushService");

async function sendPushNotifications({ pushTokens, pushType, info }) {
  try {
    for (let i = 0; i < pushTokens.length; i++) {
      await callPushService({
        pushToken: pushTokens[i],
        isVoip: false,
        unreadCount: 1,
        isMuted: false,
        payload: {
          pushType,
          info,
        },
      });
    }
  } catch (error) {
    logger.error("sendPushNotifications", error);
    return;
  }
}

module.exports = sendPushNotifications;
