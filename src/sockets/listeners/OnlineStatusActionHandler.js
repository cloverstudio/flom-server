const { Const } = require("#config");
const { logger, redis } = require("#infra");

module.exports = async function (socketApi, socket) {
  /**
     * @api {socket} "onlineStatus" onlineStatus
     * @apiName onlineStatus
     * @apiGroup Socket 
     * @apiDescription get user's online status

     */

  socket.on("onlineStatus", async (userId, callback) => {
    try {
      if (!userId) {
        socket.emit("socketerror", { code: Const.responsecodeSigninInvalidToken });
        return;
      }

      const res = await redis.get(Const.redisKeyOnlineStatus + userId);
      if (!res) return callback(Const.onlineStatus.offline);

      callback(res.lastSeenTimestamp || Const.onlineStatus.online);
    } catch (error) {
      logger.error("onlineStatus", error);
      socket.emit("socketerror", { code: Const.resCodeSocketUnknownError });
      return;
    }
  });
};
