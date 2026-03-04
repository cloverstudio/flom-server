const { Const } = require("#config");
const { logger } = require("#infra");

module.exports = async function (socket) {
  /**
     * @api {socket} "pingok" ping ok
     * @apiName ping ok
     * @apiGroup Socket 
     * @apiDescription answer for ping request
     * @apiParam {string} userId userId

     */

  socket.on("pingok", async function (param) {
    try {
      if (!param.userId) {
        socket.emit("socketerror", { code: Const.responsecodeSigninInvalidToken });
        return;
      }
    } catch (error) {
      logger.error("pingok", error);
      socket.emit("socketerror", { code: Const.resCodeSocketUnknownError });
      return;
    }
  });
};
