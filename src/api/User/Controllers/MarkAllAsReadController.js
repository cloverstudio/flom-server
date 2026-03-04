"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { History } = require("#models");

/**
     * @api {post} /api/v2/user/history/markall MarkAll
     * @apiName MarkAll
     * @apiGroup WebAPI
     * @apiDescription Mark all as read
     * @apiHeader {String} access-token Users unique access-token.
     * @apiParam {String} chatId
     * @apiParam {String} chatType
     * @apiSuccessExample Success-Response:
{}

**/

router.post("/", auth({ allowUser: true }), async function (request, response) {
  try {
    await History.updateMany(
      { userId: request.user._id.toString(), unreadCount: { $gt: 0 } },
      { unreadCount: 0, lastUpdateUnreadCount: Date.now() },
      { multi: true },
    );

    return Base.successResponse(response, Const.responsecodeSucceed, {});
  } catch (error) {
    return Base.errorResponse(
      response,
      Const.httpCodeServerError,
      "MarkAllAsReadController",
      error,
    );
  }
});

module.exports = router;
