const { redis, logger } = require("#infra");
const { Const } = require("#config");

const OnlineStatusChecker = {
  start: function () {
    setInterval(async () => {
      try {
        const now = Date.now();
        const keys = await redis.keys(Const.redisKeyOnlineStatus + "*");

        let i = 0,
          limit = 100;
        let promises = [];

        for (const key of keys) {
          const value = await redis.get(key);
          if (!value) continue;

          if (value.onlineTimestamp && now - value.onlineTimestamp > Const.offlineTimeLimit) {
            // goes offline
            const saveValue = JSON.stringify({
              lastSeenTimestamp: now,
            });

            promises.push(redis.set(key, saveValue));
          }

          i++;

          if (i === limit || i === keys.length - 1) {
            await Promise.allSettled(promises);
            i = 0;
            promises = [];
          }
        }
      } catch (error) {
        logger.error("OnlineStatusChecker", error);
      }
    }, Const.onlineCheckerInterval);
  },
};

module.exports = OnlineStatusChecker;
