const { Const, Config } = require("#config");
const Utils = require("#utils");
const { logger } = require("#infra");
const { FlomMessage } = require("#models");
const { updateHistory, notifyUpdateMessage } = require("#logics");

module.exports = function (socket) {
  /**
   * @api {socket} "updateAttributes" Update Attributes
   * @apiName Update Attributes
   * @apiGroup Socket
   * @apiDescription Update Attributes
   * @apiParam {string} userID User ID
   * @apiParam {string} messageID Message ID
   * @apiParam {string} attributes Atributes
   */

  socket.on("updateAttributes", async function (param, callback) {
    try {
      console.log("updateAttributes params: ", param);

      const newAttributes = param.attributes;

      if (!param.messageID) {
        socket.emit("socketerror", { code: Const.resCodeSocketUpdateNoMessageID });
        return;
      }

      if (!param.userID) {
        socket.emit("socketerror", { code: Const.resCodeSocketUpdateNoUserID });
        return;
      }

      const message = await FlomMessage.findById(param.messageID).lean();

      const updateParams = { attributes: newAttributes };
      if (message.type == Const.messageTypeOffer || message.type == Const.messageTypeRequestPay) {
        updateParams.created = Date.now();
      }
      await FlomMessage.findByIdAndUpdate(param.messageID, updateParams);

      let pushType = null,
        stub = "";
      switch (newAttributes.product.status) {
        case Const.offerMessageStatusInitiated:
          pushType = Const.pushTypeOfferInitiated;
          stub = " ";
          break;
        case Const.offerMessageStatusAccepted:
          pushType = Const.pushTypeOfferAccepted;
          stub = " accepted ";
          break;
        case Const.offerMessageStatusRejected:
          pushType = Const.pushTypeOfferRejected;
          stub = " rejected ";
          break;
        case Const.offerMessageStatusRefused:
          pushType = Const.pushTypeOfferRefused;
          stub = " refused ";
        default:
          pushType = null;
          break;
      }

      if (pushType) {
        const productName = message.attributes.product.name;
        const roomId = message.roomID;
        const temp = roomId.split("-");
        const receiver1 = temp[1];
        const receiver2 = temp[2];
        const message = `Offer${stub}for item ${productName}`;

        Utils.sendFlomPush({
          senderId: Config.flomSupportAgentId,
          receiverId: receiver1,
          message,
          messageiOs: message,
          pushType,
          isMuted: false,
          roomId,
        });

        Utils.sendFlomPush({
          senderId: Config.flomSupportAgentId,
          receiverId: receiver2,
          message,
          messageiOs: message,
          pushType,
          isMuted: false,
          roomId,
        });
      }

      const messages = await FlomMessage.populateMessages(message);

      if (messages.length > 0) {
        const obj = messages[0];
        obj.attributes = newAttributes;
        obj.created = updateParams.created ? updateParams.created : messages[0].created;

        updateHistory.updateByMessage(obj);
        notifyUpdateMessage.notify(obj);
      }

      if (typeof callback === "function") callback(message);
    } catch (error) {
      logger.error("updateAttributes", error);
      socket.emit("socketerror", { code: Const.resCodeSocketUnknownError });
      return;
    }
  });
};
