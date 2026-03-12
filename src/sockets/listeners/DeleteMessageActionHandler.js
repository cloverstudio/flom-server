const { Const } = require("#config");
const { logger } = require("#infra");
const { History, FlomMessage } = require("#models");
const { notifyUpdateMessage } = require("#logics");

module.exports = function (socket) {
  /**
   * @api {socket} "deleteMessage" Delete Message
   * @apiName Delete Message
   * @apiGroup Socket
   * @apiDescription Delete Message
   * @apiParam {string} userID User ID
   * @apiParam {string} messageID Message ID
   *
   */

  socket.on("deleteMessage", async function (param) {
    try {
      if (!param.messageID) {
        socket.emit("socketerror", { code: Const.resCodeSocketDeleteNoMessageID });
        return;
      }
      if (!param.userID) {
        socket.emit("socketerror", { code: Const.resCodeSocketDeleteNoUserID });
        return;
      }

      const deletedMessageTimestamp = Date.now();

      const message = await FlomMessage.findById(param.messageID).lean();
      if (!message) {
        logger.error("deleteMessage socket, no message found");
        return;
      }

      await History.updateMany(
        { "lastMessage.messageId": param.messageID },
        {
          "lastMessage.deleted": deletedMessageTimestamp,
          "lastMessage.message": "",
          lastUpdate: deletedMessageTimestamp,
        },
      );

      await FlomMessage.findByIdAndUpdate(message._id.toString(), {
        message: "",
        file: null,
        location: null,
        deleted: deletedMessageTimestamp,
      });

      const messages = await FlomMessage.populateMessages(message);

      if (messages.length > 0) {
        const obj = messages[0];
        obj.deleted = deletedMessageTimestamp;
        obj.message = "";
        obj.file = null;
        obj.location = null;

        notifyUpdateMessage(obj);
      }
    } catch (error) {
      logger.error("deleteMessage", error);
      socket.emit("socketerror", { code: Const.resCodeSocketUnknownError });
      return;
    }
  });
};
