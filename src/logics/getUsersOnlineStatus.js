"use strict";

const { Const } = require("#config");
const { redis, logger } = require("#infra");

async function getUsersOnlineStatus(userIds = []) {
  try {
    const result = [];

    for (const userId of userIds) {
      const val = await redis.get(Const.redisKeyOnlineStatus + userId);

      if (val && val.onlineTimestamp) {
        result.push({ userId, onlineStatus: 1 });
      } else {
        if (val && val.lastSeenTimestamp) {
          result.push({
            userId,
            onlineStatus: null,
            lastSeen: val.lastSeenTimestamp,
          });
        } else {
          result.push({ userId, onlineStatus: null, lastSeen: null });
        }
      }
    }

    return result;
  } catch (error) {
    logger.error("getUsersOnlineStatus error ", err);
    return 0;
  }
}

module.exports = getUsersOnlineStatus;
