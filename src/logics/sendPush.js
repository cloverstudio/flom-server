const { logger } = require("#infra");
const { Const } = require("#config");
const Utils = require("#utils");

async function sendPush(tokenAndBadgeCount, payload, isVoip) {
  try {
    for (const t of tokenAndBadgeCount) {
      let pushToken = t.token;
      let unreadCount = t.badge;

      if (!pushToken) {
        continue;
      }

      const payloadSize = Buffer.byteLength(JSON.stringify(payload), "utf8");

      if (payloadSize > 3750) {
        payload = {
          pushType: Const.pushTypeNewActivity,
          message: {
            created: Date.now(),
            id: "",
            message: "Check for new activity. Tap to view.",
            messageiOs: "Check for new activity. Tap to view.",
            type: 1,
            title: "New activity.",
          },
        };
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
