"use strict";

/**
 * @api {get} /api/v2/whatsapp/:chatId/status Get chat WhatsApp status
 * @apiVersion 2.0.34
 * @apiName Get chat WhatsApp status
 * @apiGroup WebAPI WhatsApp
 * @apiDescription Returns the WhatsApp status of a chat. Chat has to be private (1-userId1-userId2). Returns enabled for WA chat, and disabled otherwise.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1776689659273,
 *     "data": {
 *         "status": String,  // enabled or disabled
 *         "windowExpiresAt": Number
 *     }
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
 * @apiError (Errors) 443040 One of the chat users has not been found
 */

const router = require("express").Router();
const Base = require("../../Base");
const { Const, Config } = require("#config");
const { auth } = require("#middleware");
const { WhatsAppUserMapping, User } = require("#models");

router.get("/:chatId/status", auth({ allowUser: true }), async function (request, response) {
  try {
    const chatId = request.params.chatId;

    if (!chatId) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeChatIdNotFound,
        message: `GetWhatsAppChatStatus, chatId is required`,
      });
    }

    const temp = chatId.split("-");

    const chatType = temp[0];
    if (chatType != "1") {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeChatIdNotFound,
        message: `GetWhatsAppChatStatus, invalid chatId, wrong type: ${chatType}`,
      });
    }

    const userId1 = temp[1];
    const userId2 = temp[2];

    if (!userId1 || !userId2) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeChatIdNotFound,
        message: `GetWhatsAppChatStatus, invalid chatId, missing userIds: ${userId1}, ${userId2}`,
      });
    }

    const user1 = await User.findById(userId1).lean();
    if (!user1) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNotFound,
        message: `GetWhatsAppChatStatus, invalid chatId, user1 not found`,
      });
    }

    const user2 = await User.findById(userId2).lean();
    if (!user2) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNotFound,
        message: `GetWhatsAppChatStatus, invalid chatId, user2 not found`,
      });
    }

    let status = "disabled";

    const mapping = await WhatsAppUserMapping.findOne({
      $or: [
        {
          senderPhoneNumber: user1.phoneNumber,
          receiverPhoneNumber: user2.phoneNumber,
          enabled: true,
        },
        {
          senderPhoneNumber: user2.phoneNumber,
          receiverPhoneNumber: user1.phoneNumber,
          enabled: true,
        },
      ],
    }).lean();

    if (mapping) {
      status = "enabled";
    }

    let windowExpiresAt = 0;

    if (mapping.receiverPhoneNumber === user1.phoneNumber) {
      windowExpiresAt = user1.whatsApp?.windowExpiresAt || 0;
    } else {
      windowExpiresAt = user2.whatsApp?.windowExpiresAt || 0;
    }

    return Base.successResponse(response, Const.responsecodeSucceed, { status, windowExpiresAt });
  } catch (error) {
    return Base.newErrorResponse({ response, message: "GetWhatsAppChatStatus", error });
  }
});

module.exports = router;
