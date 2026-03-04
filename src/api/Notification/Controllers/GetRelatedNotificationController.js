"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { Notification, User } = require("#models");

/**
 * @api {get} /api/v2/notifications/related/:relatedNotificationId Get related notification flom_v1
 * @apiVersion 2.0.10
 * @apiName Get related notification flom_v1
 * @apiGroup WebAPI Notification
 * @apiDescription API for getting notification by related notification id
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1644575479952,
 *   "data": {
 *     "notification": {
 *       "_id": "620617b1768fd12cb761893d",
 *       "receiverIds": [
 *         "60e4384b560d1466637e3eca"
 *       ],
 *       "created": 1644566434987,
 *       "title": "Request to join Testinnn accepted",
 *       "referenceId": "6202205e403b2d3177236d14",
 *       "relatedNotificationId": "620617a2768fd12cb761893b",
 *       "senderId": "6101140dcbf8f756d06168fd",
 *       "notificationType": 5,
 *       "__v": 0,
 *       "userName": "ivoperic"
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
 * @apiError (Errors) 443495 Invalid related notification id
 * @apiError (Errors) 443496 Notification not found (either related notification id is wrong or you are not the receiver of the notification)
 * @apiError (Errors) 4000007 Token not valid
 */

router.get(
  "/:relatedNotificationId",
  auth({ allowUser: true }),
  async function (request, response) {
    try {
      const { relatedNotificationId } = request.params;
      const requestUserId = request.user._id.toString();

      if (!Utils.isValidObjectId(relatedNotificationId)) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeNoNotificationId,
          message: `GetRelatedNotificationController, invalid related notification id`,
        });
      }

      const notification = await Notification.findOne({
        relatedNotificationId,
        receiverIds: requestUserId,
      }).lean();
      if (!notification) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidNotificationId,
          message: `GetRelatedNotificationController, notification not found`,
        });
      }

      const sender = await User.findOne({ _id: notification.senderId }, { userName: 1 }).lean();
      notification.userName = sender.userName;

      Base.successResponse(response, Const.responsecodeSucceed, { notification });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "GetRelatedNotificationController",
        error,
      });
    }
  },
);

module.exports = router;
