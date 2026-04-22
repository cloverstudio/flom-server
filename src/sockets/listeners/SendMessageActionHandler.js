const { Const } = require("#config");
const { logger } = require("#infra");
const { sendMessage } = require("#logics");
const { WhatsAppUserMapping } = require("#models");

module.exports = function (socketApi, socket) {
  /**
   * @api {socket} "sendMessage" Send New Message
   * @apiName Send Message
   * @apiGroup Socket
   * @apiDescription Send new message by socket
   * @apiParam {string} roomID Room ID
   * @apiParam {string} userID User ID
   * @apiParam {string} type Message Type. 1:Text 2:File 3:Location
   * @apiParam {string} message Message if type == 1
   * @apiParam {string} fileID File ID if type == 2
   * @apiParam {object} location lat and lng if type == 3
   *
   */

  socket.on("sendMessage", async (param, callback) => {
    try {
      // logger.info("Sending message - " + JSON.stringify(param));

      if (!param.roomID || param.roomID.includes("null")) {
        console.error("roomID error - " + Const.resCodeSocketSendMessageNoRoomID);
        return socket.emit("socketerror", { code: Const.resCodeSocketSendMessageNoRoomID });
      }

      if (!param.userID) {
        console.error("userID error - " + Const.resCodeSocketSendMessageNoUserId);
        return socket.emit("socketerror", { code: Const.resCodeSocketSendMessageNoUserId });
      }

      if (!param.type) {
        console.error("type error - " + Const.resCodeSocketSendMessageNoType);
        return socket.emit("socketerror", { code: Const.resCodeSocketSendMessageNoType });
      }

      if (param.type == Const.messageTypeText && !param.message) {
        console.error("message error - " + Const.resCodeSocketSendMessageNoMessage);
        return socket.emit("socketerror", { code: Const.resCodeSocketSendMessageNoMessage });
      }

      if (
        param.type == Const.messageTypeLocation &&
        (!param.location || !param.location.lat || !param.location.lng)
      ) {
        console.error("location error - " + Const.resCodeSocketSendMessageNoLocation);
        return socket.emit("socketerror", { code: Const.resCodeSocketSendMessageNoLocation });
      }

      param.ipAddress = socket.handshake.headers["x-forwarded-for"];

      if (!param.ipAddress) {
        param.ipAddress = socket.handshake.address;
      }

      const arr = param.roomID.split("-");
      if (arr[0] == Const.chatTypePrivate) {
        let s, r;
        if (arr[1] == param.userID) {
          s = arr[1];
          r = arr[2];
        } else {
          s = arr[2];
          r = arr[1];
        }

        const whatsappMapping = await WhatsAppUserMapping.findOne({
          senderPhoneNumber: s,
          receiverPhoneNumber: r,
        }).lean();

        if (whatsappMapping) {
          param.wa = true;
        }
      }

      const messageObj = await sendMessage(param);
      if (typeof callback === "function") callback(messageObj);

      return;
    } catch (error) {
      logger.error("sendMessage", error);
      socket.emit("socketerror", { code: Const.resCodeSocketUnknownError });
      return;
    }
  });
};
