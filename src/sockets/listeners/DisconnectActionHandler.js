const { Const } = require("#config");
const { logger, redis } = require("#infra");
const { CallLog } = require("#models");
const socketApi = require("../socket-api");
const { cancelCall } = require("#logics");

module.exports = function (socket) {
  /**
   * @api {socket} "disconnect" Disconnect
   * @apiName Disconnect
   * @apiGroup Socket
   * @apiDescription Disconnect from socket
   */

  socket.on("disconnectSocket", async function () {
    try {
      const user = await redis.get(Const.redisKeySocketId + socket.id);
      if (!user) {
        logger.error("user not found");
        return;
      }

      const userId = user._id.toString();

      const openCalls = await CallLog.findOpenCallByUserId(userId);
      if (openCalls && openCalls.length > 0) {
        openCalls.forEach(({ calleeUserId, callRoomId }) =>
          cancelCall(socket, { userId: calleeUserId, callRoomId }),
        );
      }

      await redis.set(Const.redisKeyOnlineStatus + userId, {
        lastSeenTimestamp: Date.now(),
      });

      socketApi.flom.emitAll("onlineStatus", { userId: userId, online: false });

      return;
    } catch (error) {
      logger.error("disconnectSocket", error);
      socket.emit("socketerror", { code: Const.resCodeSocketUnknownError });
      return;
    }
  });
};
