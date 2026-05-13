"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { User } = require("#models");

/**
 * @api {patch} /api/v2/user/notifications/subscriptions Update User Notification Subscription flom_v1
 * @apiVersion 2.0.34
 * @apiName  Update User Notification Subscription
 * @apiGroup WebAPI User
 * @apiDescription  Update user notification subscriptions.
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiParam {String}   userId       ID of the user to subscribe to notifications for
 * @apiParam {Boolean}  [enabled]    True to enable, false to disable notifications in general
 * @apiParam {Boolean}  [push]       True to enable, false to disable push notifications
 * @apiParam {Boolean}  [whatsApp]   True to enable, false to disable WhatsApp notifications
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "notificationSubscriptions": [
 *     {
 *       "userId": "1234567890",
 *       "enabled": true,
 *       "push": true,
 *       "whatsApp": false
 *     }
 *   ]
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443230 Invalid userId
 * @apiError (Errors) 443040 User not found
 * @apiError (Errors) 4000007 Token invalid
 */

router.patch("/subscriptions", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const { userId, enabled, push, whatsApp } = request.body;

    if (!userId || !Utils.isObjectId(userId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidUserId,
        message: `NotificationSubscriptionsController, invalid userId: ${userId}`,
      });
    }

    const targetUser = await User.findById(userId).lean();
    if (!targetUser) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNotFound,
        message: `NotificationSubscriptionsController, user not found for userId: ${userId}`,
      });
    }

    let sub = { userId };
    let exists = false;
    for (const s of user.notificationSubscriptions) {
      if (s.userId === userId) {
        sub = s;
        exists = true;
        break;
      }
    }

    if (enabled !== undefined && typeof enabled === "boolean") {
      sub.enabled = enabled;
    }
    if (push !== undefined && typeof push === "boolean") {
      sub.push = push;
    }
    if (whatsApp !== undefined && typeof whatsApp === "boolean") {
      sub.whatsApp = whatsApp;
    }

    if (!exists) {
      user.notificationSubscriptions.push(sub);
    }

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { notificationSubscriptions: user.notificationSubscriptions },
      { new: true, lean: true },
    );

    const responseData = { notificationSubscriptions: updatedUser.notificationSubscriptions };
    Base.successResponse(response, Const.responsecodeSucceed, responseData);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "NotificationSubscriptionsController",
      error,
    });
  }
});

module.exports = router;
