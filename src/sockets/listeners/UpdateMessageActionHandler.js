const { Const } = require("#config");
const { logger, encryptionManager } = require("#infra");
const { History, Message } = require("#models");
const { notifyUpdateMessage } = require("#logics");

module.exports = function (socket) {
  /**
   * @api {socket} "updateMessage" Update Message
   * @apiName Update Message
   * @apiGroup Socket
   * @apiDescription Delete Message
   * @apiParam {string} userID User ID
   * @apiParam {string} messageID Message ID
   * @apiParam {string} message Mesage
   */

  socket.on("updateMessage", async function (param) {
    try {
      const newMessage = param.message;

      if (!param.messageID) {
        socket.emit("socketerror", { code: Const.resCodeSocketUpdateNoMessageID });
        return;
      }

      if (!param.userID) {
        socket.emit("socketerror", { code: Const.resCodeSocketUpdateNoUserID });
        return;
      }

      const message = await Message.findById(param.messageID).lean();
      if (!message) {
        logger.error("updateMessage socket, no message found");
        return;
      }

      const histories = await History.find({
        "lastMessage.messageId": result.message._id.toString(),
      }).lean();

      for (const element of histories) {
        await History.findByIdAndUpdate(element._id.toString(), {
          "lastMessage.message": encryptionManager.decryptText(newMessage),
          lastUpdate: Date.now(),
        });
      }

      await Message.findByIdAndUpdate(message._id.toString(), {
        message: encryptionManager.decryptText(newMessage),
      });

      const messages = await Message.populateMessages(message);

      if (messages.length > 0) {
        const obj = messages[0];
        obj.message = newMessage;

        notifyUpdateMessage(obj);
      }

      return;
    } catch (error) {
      logger.error("updateMessage", error);
      socket.emit("socketerror", { code: Const.resCodeSocketUnknownError });
      return;
    }
  });
};
