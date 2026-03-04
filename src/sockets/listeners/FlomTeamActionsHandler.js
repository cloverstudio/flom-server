const { Const } = require("#config");
const { logger, redis } = require("#infra");

module.exports = function (socket) {
  /**
     * @api {socket} "joinChatAsFlomTeam" Send typing notification
     * @apiName Typing Notification
     * @apiGroup Socket 
     * @apiDescription Send typing notification

     * @apiParam {string} userID User ID
     * @apiParam {string} roomID Room ID
     * @apiParam {string} type 0: Remove typing notificaiton 1: Show typing notification
     *
     */

  socket.on("joinChatAsFlomTeam", async function (param) {
    try {
      if (!param.target_user_id) {
        socket.emit("socketerror", { code: Const.resCodeSocketTypingNoUserID });
        return;
      }

      await redis.set("flom_team_current_chat", param.target_user_id + "-" + socket.id);
    } catch (error) {
      logger.error("joinChatAsFlomTeam", error);
      socket.emit("socketerror", { code: Const.resCodeSocketUnknownError });
      return;
    }
  });

  socket.on("leaveChatAsFlomTeam", async function (param) {
    try {
      await redis.del("flom_team_current_chat");
    } catch (error) {
      logger.error("leaveChatAsFlomTeam", error);
      socket.emit("socketerror", { code: Const.resCodeSocketUnknownError });
      return;
    }
  });
};
