const { logger } = require("#infra");
const Utils = require("#utils");

async function sendPush(tokenAndBadgeCount, payload, isVoip) {
  try {
    for (const t of tokenAndBadgeCount) {
      let pushToken = t.token;
      let unreadCount = t.badge;

      if (!pushToken) {
        continue;
      }

      try {
        let data = {
          pushToken,
          unreadCount,
          payload: {
            ...payload,
            muted: t.isMuted,
            isSender: t.isSender,
            isHighPriority: payload.isHighPriority,
            setShortTtl: payload.setShortTtl,
          },
          isVoip,
        };

        await Utils.callPushService(data);
      } catch (error) {
        logger.error("sendPush inner error: ", error);
        continue;
      }
    }
  } catch (error) {
    logger.error("sendPush error: ", error);
    return;
  }
}

module.exports = sendPush;
