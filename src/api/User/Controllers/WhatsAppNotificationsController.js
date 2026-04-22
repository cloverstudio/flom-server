"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { User } = require("#models");

/**
 * @api {post} /api/v2/user/notifications/wa/:targetId Enable whatsapp notifications from seller or streamer flom_v1
 * @apiVersion 2.0.34
 * @apiName Enable whatsapp notifications from seller or streamer flom_v1
 * @apiGroup WebAPI User
 * @apiDescription  API enables WhatsApp notifications for the user from a seller or streamer (targetId).
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiSuccessExample Success Response
 * {
 *   "code": 1,
 *   "time": 1507293117920,
 *   "data": {}
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443928 Invalid target id
 * @apiError (Errors) 4000007 Token invalid
 */

router.post("/:targetId", auth({ allowUser: true }), async function (request, response) {
  try {
    const { targetId } = request.params;
    const { user } = request;

    if (!targetId || !Utils.isObjectId(targetId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidTargetId,
        message: `WhatsAppNotificationsController, invalid targetId (1): ${targetId}`,
      });
    }

    const targetUser = await User.findById(targetId);
    if (!targetUser) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidTargetId,
        message: `WhatsAppNotificationsController, invalid targetId (2): ${targetId}`,
      });
    }

    await User.findByIdAndUpdate(user._id, { $addToSet: { "whatsApp.subscriptions": targetId } });

    return Base.successResponse(response, Const.responsecodeSucceed, {});
  } catch (error) {
    logger.error("WhatsAppNotificationsController", error);
  }
});

/**
 * @api {delete} /api/v2/user/notifications/wa/:targetId Disable whatsapp notifications from seller or streamer flom_v1
 * @apiVersion 2.0.34
 * @apiName Disable whatsapp notifications from seller or streamer flom_v1
 * @apiGroup WebAPI User
 * @apiDescription  API disables WhatsApp notifications for the user from a seller or streamer (targetId).
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiSuccessExample Success Response
 * {
 *   "code": 1,
 *   "time": 1507293117920,
 *   "data": {}
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443928 Invalid target id
 * @apiError (Errors) 4000007 Token invalid
 */

router.delete("/:targetId", auth({ allowUser: true }), async function (request, response) {
  try {
    const { targetId } = request.params;
    const { user } = request;

    if (!targetId || !Utils.isObjectId(targetId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidTargetId,
        message: `WhatsAppNotificationsController, invalid targetId (1): ${targetId}`,
      });
    }

    const targetUser = await User.findById(targetId);
    if (!targetUser) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidTargetId,
        message: `WhatsAppNotificationsController, invalid targetId (2): ${targetId}`,
      });
    }

    await User.findByIdAndUpdate(user._id, { $pull: { "whatsApp.subscriptions": targetId } });

    return Base.successResponse(response, Const.responsecodeSucceed, {});
  } catch (error) {
    logger.error("WhatsAppNotificationsController", error);
  }
});

module.exports = router;
