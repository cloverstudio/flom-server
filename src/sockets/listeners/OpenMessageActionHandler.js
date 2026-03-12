const { Const } = require("#config");
const { logger } = require("#infra");
const { FlomMessage } = require("#models");
const socketApi = require("../socket-api");
const { updateHistory } = require("#logics");

module.exports = function (socket) {
  /**
     * @api {socket} "openMessage" open unread message
     * @apiName openMessage
     * @apiGroup Socket 
     * @apiDescription set user online

     */
  socket.on("openMessage", async function (param) {
    try {
      if (!param.messageID) {
        socket.emit("socketerror", { code: Const.resCodeSocketOpenMessageWrongMessageID });
        return;
      }

      if (!param.userID) {
        socket.emit("socketerror", { code: Const.resCodeSocketOpenMessageNoUserId });
        return;
      }

      const message = await FlomMessage.findById(param.messageID).lean();
      if (!message) {
        logger.error("openMessage socket, no message found");
        return;
      }
      if (message.userID == param.userID) {
        // do nothing for message sent user
        return;
      }

      const deliveredToRow = { userId: param.userID, at: Date.now() };
      const updateFields = { $addToSet: { deliveredTo: deliveredToRow } };
      if (!param.doNotUpdateSeenBy) {
        const seenByRow = { userId: param.userID, at: Date.now(), version: 2 };
        updateFields.$addToSet.seenBy = seenByRow;
      }

      const updatedMessage = await FlomMessage.findByIdAndUpdate(param.messageID, updateFields, {
        new: true,
        lean: true,
      });

      await updateHistory.updateLastMessageStatus({
        messageId: param.messageID,
        delivered: updatedMessage.sentTo.length == updatedMessage.deliveredTo.length,
        seen: param.doNotUpdateSeenBy
          ? false
          : updatedMessage.sentTo.length == updatedMessage.seenBy.length,
      });

      const messages = await FlomMessage.populateMessages([updatedMessage]);
      const populatedMessage = messages[0];

      // reset unread count
      await updateHistory.resetUnreadCount({
        roomID: populatedMessage.roomID,
        userID: param.userID,
      });

      // websocket notification
      const chatType = populatedMessage.roomID.split("-")[0];

      if (chatType == Const.chatTypeGroup) {
        socketApi.flom.emitToRoom(populatedMessage.roomID, "updatemessages", [populatedMessage]);
      } else if (chatType == Const.chatTypeRoom) {
        socketApi.flom.emitToRoom(populatedMessage.roomID, "updatemessages", [populatedMessage]);
      } else if (chatType == Const.chatTypePrivate) {
        const splitAry = populatedMessage.roomID.split("-");
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

        socketApi.flom.emitToRoom(fromUser, "updatemessages", [populatedMessage]);
        socketApi.flom.emitToRoom(toUser, "updatemessages", [populatedMessage]);
      }
    } catch (error) {
      logger.error("openMessage", error);
      socket.emit("socketerror", { code: Const.resCodeSocketUnknownError });
      return;
    }
  });
};
