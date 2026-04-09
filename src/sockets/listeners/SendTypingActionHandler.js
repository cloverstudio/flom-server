const { Const } = require("#config");
const { logger } = require("#infra");
const { User } = require("#models");

module.exports = function (socketApi, socket) {
  /**
     * @api {socket} "sendTyping" Send typing notification
     * @apiName Typing Notification
     * @apiGroup Socket 
     * @apiDescription Send typing notification

     * @apiParam {string} userID User ID
     * @apiParam {string} roomID Room ID
     * @apiParam {string} type 0: Remove typing notificaiton 1: Show typing notification
     *
     */

  socket.on("sendtyping", async function (param) {
    try {
      if (!param.userID) {
        socket.emit("socketerror", { code: Const.resCodeSocketTypingNoUserID });
        return;
      }

      if (!param.roomID) {
        socket.emit("socketerror", { code: Const.resCodeSocketTypingNoRoomID });
        return;
      }

      if (param.type === undefined) {
        socket.emit("socketerror", { code: Const.resCodeSocketTypingNoType });
        return;
      }

      const roomID = param.roomID;
      const chatType = param.roomID.split("-")[0];
      const roomIDSplitted = param.roomID.split("-");

      // websocket notification
      if (chatType == Const.chatTypeGroup) {
        socketApi.emitToRoom(roomID, "typing", param);
      } else if (chatType == Const.chatTypeRoom) {
        socketApi.emitToRoom(roomID, "typing", param);
      } else if (chatType == Const.chatTypePrivate) {
        const splitAry = roomID.split("-");
        if (splitAry.length < 2) return;

        const user1 = splitAry[1];
        const user2 = splitAry[2];

        let toUser = null;
        let fromUser = null;

        if (user1 == param.userID) {
          toUser = user2;
          fromUser = user1;
        } else {
          toUser = user1;
          fromUser = user2;
        }

        const user = await User.findById(toUser).lean();
        if (!user) return;

        if (user.blocked && user.blocked.includes(fromUser)) return;
        socketApi.emitToRoom(toUser, "typing", param);
      }

      return;
    } catch (error) {
      logger.error("sendtyping", error);
      socket.emit("socketerror", { code: Const.resCodeSocketUnknownError });
      return;
    }
  });
};
