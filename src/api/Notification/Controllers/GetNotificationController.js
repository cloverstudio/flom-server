"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { Notification } = require("#models");

/**
 * @api {get} /api/v2/notifications/:notificationId Get notification flom_v1
 * @apiVersion 2.0.10
 * @apiName Get notification flom_v1
 * @apiGroup WebAPI Notification
 * @apiDescription API for getting notification by notification id
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1644500013534,
 *   "data": {
 *     "notification": {
 *       "_id": "6203aebf28981725bde9562f",
 *       "receiverIds": [
 *         "6041f57eb0ff5e3dca6f3bb5",
 *         "61377add1f60bd126f66ca36"
 *       ],
 *       "created": 1644408511147,
 *       "title": "Invite to join leave tedt",
 *       "referenceId": "6203aebf28981725bde9562e",
 *       "senderId": "6034e1c050d293417149305f",
 *       "notificationType": 6,
 *       "__v": 0
 *     }
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 443495 Invalid notification id
 * @apiError (Errors) 443496 Notification not found (either notification id is wrong or you are not the receiver of the notification)
 * @apiError (Errors) 4000007 Token not valid
 */

router.get("/:notificationId", auth({ allowUser: true }), async function (request, response) {
  try {
    const { notificationId } = request.params;
    const requestUserId = request.user._id.toString();

    if (!Utils.isValidObjectId(notificationId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoNotificationId,
        message: `GetNotificationController, invalid notification id`,
      });
    }

    const notification = await Notification.findOne({
      _id: notificationId,
      receiverIds: requestUserId,
    }).lean();
    if (!notification) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidNotificationId,
        message: `GetNotificationController, notification not found`,
      });
    }

    Base.successResponse(response, Const.responsecodeSucceed, { notification });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "GetNotificationController",
      error,
    });
  }
});

module.exports = router;
