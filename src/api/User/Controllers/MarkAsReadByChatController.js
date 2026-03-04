"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { History } = require("#models");

/**
     * @api {post} /api/v2/user/history/markchat MarkAll
     * @apiName MarkAll
     * @apiGroup WebAPI
     * @apiDescription Mark all as read
     * @apiHeader {String} access-token Users unique access-token.
     * @apiSuccessExample Success-Response:
{}

**/

router.post("/", auth({ allowUser: true }), async function (request, response) {
  try {
    if (!request.body.chatId) {
      return Base.successResponse(response, Const.responsecodeMuteWrongParam);
    }

    if (!request.body.chatType) {
      return Base.successResponse(response, Const.responsecodeMuteWrongParam);
    }

    await History.updateMany(
      {
        userId: request.user._id.toString(),
        chatId: request.body.chatId,
        chatType: request.body.chatType,
        unreadCount: { $gt: 0 },
      },
      { unreadCount: 0, lastUpdateUnreadCount: Date.now() },
      { multi: true },
    );

    return Base.successResponse(response, Const.responsecodeSucceed, {});
  } catch (error) {
    return Base.errorResponse(
      response,
      Const.httpCodeServerError,
      "MarkAsReadByChatController",
      error,
    );
  }
});

module.exports = router;
