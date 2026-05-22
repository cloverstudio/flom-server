"use strict";

/**
 * @api {post} /api/v2/whatsapp/followup Send follow-up WhatsApp message
 * @apiVersion 2.0.34
 * @apiName Send follow-up WhatsApp message
 * @apiGroup WebAPI WhatsApp
 * @apiDescription Sends a follow-up WhatsApp message to a chat. Chat has to be private (1-userId1-userId2).
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {String}  chatId     Chat ID in which to send message. Receiver is determined based on the chatId and the access token (token user is always sender/seller).
 * @apiParam {String}  productId  Product ID related to the follow-up message
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1776689659273,
 *     "data": {}
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 4000007 Token not valid
 * @apiError (Errors) 430560 Invalid chat id (missing or wrong format: invalid type, no userids)
 * @apiError (Errors) 443040 Receiver not found
 * @apiError (Errors) 443225 Invalid productId (missing or not found)
 * @apiError (Errors) 400160 Product not found
 * @apiError (Errors) 443951 Sending WhatsApp message failed (no message sent, user may have disabled notifications or insufficient balance)
 */

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const, Config } = require("#config");
const { auth } = require("#middleware");
const { User, Product } = require("#models");
const Utils = require("#utils");
const Logics = require("#logics");

router.post("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const { chatId, productId } = request.body;

    if (!chatId) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeChatIdNotFound,
        message: "SendFollowupMessageController, chatId missing",
      });
    }

    const temp = chatId.split("-");

    const chatType = temp[0];
    if (chatType != "1") {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeChatIdNotFound,
        message: "SendFollowupMessageController, invalid chatId, wrong type: " + chatType,
      });
    }

    const userId1 = temp[1];
    const userId2 = temp[2];

    if (!userId1 || !userId2) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeChatIdNotFound,
        message:
          "SendFollowupMessageController, invalid chatId, missing userIds: " +
          userId1 +
          ", " +
          userId2,
      });
    }

    const receiverId = userId1 === user._id.toString() ? userId2 : userId1;

    const receiver = await User.findById(receiverId).lean();

    if (!receiver) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNotFound,
        message: "SendFollowupMessageController, receiver not found: " + receiverId,
      });
    }

    if (!productId || !Utils.isValidObjectId(productId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidProductId,
        message: "SendFollowupMessageController, invalid productId: " + productId,
      });
    }

    const product = await Product.findById(productId).lean();

    if (!product) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeProductNotFound,
        message: "SendFollowupMessageController, product not found: " + productId,
      });
    }

    const wamIds = await Logics.sendWhatsAppMessages({
      sender: user,
      receivers: [receiver],
      template: "sellerFollowup",
      userName: user.userName,
      productName: product.name,
    });

    if (!wamIds.length) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeSendingWhatsAppMessageFailed,
        message:
          "SendFollowupMessageController, no WhatsApp message sent, user may have disabled notifications or insufficient balance",
      });
    }

    const params = {
      isRecursiveCall: false,
      type: Const.messageTypeWhatsAppFollowup,
      userID: user._id.toString(),
      roomID: chatId,
      message: "",
      created: Date.now(),
      plainTextMessage: true,
      wamId: wamIds[0],
      attributes: {
        senderName: user.userName,
        productName: product.name,
      },
    };

    await Logics.sendMessage(params);

    await User.updateOne({ _id: receiver._id }, { $set: { "whatsApp.followupMessageSent": true } });

    return Base.successResponse(response, Const.responsecodeSucceed, {});
  } catch (error) {
    return Base.newErrorResponse({ response, message: "SendFollowupMessageController", error });
  }
});

module.exports = router;
