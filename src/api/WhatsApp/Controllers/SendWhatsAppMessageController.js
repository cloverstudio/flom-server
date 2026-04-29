"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const } = require("#config");
const { auth } = require("#middleware");
const Utils = require("#utils");
const { User } = require("#models");
const { sendMessage } = require("#logics");

router.post("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const {
      message,
      receiverId,
      template,
      userName,
      liveStreamId,
      auctionName,
      auctionId,
      shippingStatus,
      orderId,
      orderName,
    } = request.body;

    if (!receiverId) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNotFound,
        message: "SendWhatsAppMessageController, receiver id missing: " + receiverId,
      });
    }

    if (!template) {
      return response.json({
        success: false,
        code: "TEMPLATE_NOT_FOUND",
      });
    }

    const senderUser = request.user;
    const receiverUser = await User.findById(receiverId).lean();

    if (!receiverUser) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNotFound,
        message: "SendWhatsAppMessageController, receiver user not found with id: " + receiverId,
      });
    }

    const wamId = await Utils.sendWhatsAppMessage({
      to: receiverUser.phoneNumber.replace("+", ""),
      ...(message && { message: `${senderUser.userName}: ${message}` }),
      template,
      userName,
      liveStreamId,
      auctionName,
      auctionId,
      shippingStatus,
      orderId,
      orderName,
    });

    if (!wamId) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeSendingWhatsAppMessageFailed,
        message: "SendWhatsAppMessageController: failed to send WhatsApp message",
      });
    }

    /*
    let roomId = null;
    if (receiverUser && senderUser.created < receiverUser.created) {
      roomId = `1-${senderUser._id.toString()}-${receiverUser?._id.toString()}`;
    } else if (receiverUser) {
      roomId = `1-${receiverUser?._id.toString()}-${senderUser._id.toString()}`;
    }
    if (!roomId) {
      logger.error("SendWhatsAppMessageController, cb: invalid roomId");
      return;
    }

    const params = {
      isRecursiveCall: false,
      type: Const.messageTypeText,
      userID: senderUser._id.toString(),
      roomID: roomId,
      message,
      created: Date.now(),
      wamId,
    };

    await sendMessage(params);
    */

    return Base.successResponse(response, Const.responsecodeSucceed);
  } catch (error) {
    return Base.newErrorResponse({ response, message: "SendWhatsAppMessageController", error });
  }
});

module.exports = router;
