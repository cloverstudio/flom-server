const { Const } = require("#config");
const { logger } = require("#infra");
const { User, Message } = require("#models");
const socketApi = require("../socket-api");
const { updateHistory } = require("#logics");

module.exports = function (socket) {
  /**
   * @api {socket} "deliverMessage" Deliver Message
   * @apiName Deliver Message
   * @apiGroup Socket
   * @apiDescription Get delivered message
   * @apiParam {string} userID User ID
   * @apiParam {string} messageID Message ID
   */

  socket.on("deliverMessage", async function (param) {
    try {
      if (!param.userID)
        return socket.emit("socketerror", { code: Const.resCodeSocketDeliverMessageNoUserId });

      if (!param.messageID)
        return socket.emit("socketerror", { code: Const.resCodeSocketDeliverMessageNoMessageId });

      const user = await User.findById(param.userID).lean();
      if (!user)
        return socket.emit("socketerror", {
          code: Const.resCodeSocketDeliverMessageWrongUserId,
        });

      const message = await Message.findById(param.messageID).lean();
      if (!message)
        return socket.emit("socketerror", {
          code: Const.resCodeSocketDeliverMessageWrongMessageId,
        });
      if (message.userID == param.userID) return;
      const isDelivered =
        message.deliveredTo.filter((item) => item.userId === param.userID).length > 0;
      if (isDelivered) return;

      const deliveredToRow = { userId: param.userID, at: Date.now() };
      const updatedMessage = await Message.findByIdAndUpdate(
        param.messageID,
        { $push: { deliveredTo: deliveredToRow } },
        { new: true },
      );

      updateHistory.updateLastMessageStatus({
        messageId: param.messageID,
        delivered: updatedMessage.sentTo.length == updatedMessage.deliveredTo.length,
      });

      await Message.populateMessages([updatedMessage]);

      // websockets
      const chatType = updatedMessage.roomID.split("-")[0];

      // websocket notification
      if (chatType == Const.chatTypeGroup) {
        socketApi.flom.emitToRoom(updatedMessage.roomID, "updatemessages", [updatedMessage]);
      } else if (chatType == Const.chatTypeRoom) {
        socketApi.flom.emitToRoom(updatedMessage.roomID, "updatemessages", [updatedMessage]);
      } else if (chatType == Const.chatTypePrivate) {
        const splitAry = updatedMessage.roomID.split("-");

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

        socketApi.flom.emitToRoom(fromUser, "updatemessages", [updatedMessage]);
        socketApi.flom.emitToRoom(toUser, "updatemessages", [updatedMessage]);
      }
    } catch (error) {
      logger.error("deliverMessage", error);
      socket.emit("socketerror", { code: Const.resCodeSocketUnknownError });
      return;
    }
  });
};
