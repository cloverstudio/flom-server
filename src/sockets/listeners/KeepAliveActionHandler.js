const { Const } = require("#config");
const { logger, redis } = require("#infra");
const { CallLog } = require("#models");

module.exports = function (socket) {
  /**
     * @api {socket} "keepalive" keepalive
     * @apiName keepalive
     * @apiGroup Socket 
     * @apiDescription set user online

     */
  socket.on("keepalive", async function (param, callback) {
    try {
      const callRoomId = param.callRoomId;

      if (callRoomId === "" || callRoomId) {
        await CallLog.updateMany(
          {
            $and: [
              {
                $or: [{ callerUserId: param.userId }, { calleeUserId: param.userId }],
              },
              { callStatus: { $not: { $eq: Const.callStatusEnded } } },
              { callRoomId: { $not: { $eq: callRoomId } } },
              { created: { $lt: Date.now() - 10 * 1000 } }, // last 10s
            ],
          },
          { callStatus: Const.callStatusEnded },
        );
      }

      // make user online
      if (param.userId) {
        await redis.set(Const.redisKeyOnlineStatus + param.userId, { onlineTimestamp: Date.now() });
      }

      if (typeof callback == "function") callback({ time: Date.now() });
    } catch (error) {
      logger.error("keepalive", error);
      socket.emit("socketerror", { code: Const.resCodeSocketUnknownError });
      return;
    }
  });
};
