"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const Logics = require("#logics");
const { auth } = require("#middleware");
const { User } = require("#models");

/**
 * @api {patch} /api/v2/user/notification-options Update users notification options flom_v1
 * @apiVersion 2.0.34
 * @apiName Update users notification options flom_v1
 * @apiGroup WebAPI User
 * @apiDescription API for updating user notification options. Frontend sends only options that were changed, so all options are optional in the request body. For example, if user only wants to change goLive notifications, request body will look like this: { "whatsApp": { "goLive": true } }
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {Object}  [whatsApp]                 WhatsApp notification options
 * @apiParam {Boolean} [whatsApp.enabled]         Enable or disable WhatsApp notifications
 * @apiParam {Boolean} [whatsApp.goLive]          Enable or disable WhatsApp go live notifications
 * @apiParam {Boolean} [whatsApp.pendingPayment]  Enable or disable WhatsApp pending payment notifications
 * @apiParam {Boolean} [whatsApp.shippingUpdate]  Enable or disable WhatsApp shipping update notifications
 * @apiParam {Boolean} [whatsApp.secondChance]    Enable or disable WhatsApp second chance notifications
 *
 * @apiSuccessExample {json} Success Response
 * {
 *     "code": 1,
 *     "time": 1776855905940,
 *     "data": {
 *         "notificationOptions": {
 *             "whatsApp": {
 *                 "enabled": false,
 *                 "enabledIntended": false,
 *                 "goLive": false,
 *                 "pendingPayment": false,
 *                 "shippingUpdate": false,
 *                 "secondChance": false
 *             }
 *         },
 *         "whatsAppPrices": {
 *             "countryCode": "HR",
 *             "marketing": 143,
 *             "utility": 36
 *         }
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
 */

router.patch("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const opts = request.body;
    const userId = request.user._id.toString();

    let user = request.user;

    const updateObj = {};

    for (const key in opts) {
      if (key !== "whatsApp") continue;

      const keyOpts = opts[key];

      for (const subKey in keyOpts) {
        if (keyOpts[subKey] === true || keyOpts[subKey] === false) {
          updateObj[`notificationOptions.${key}.${subKey}`] = keyOpts[subKey];
          if (subKey === "enabled") {
            updateObj[`notificationOptions.${key}.enabledIntended`] = keyOpts[subKey];
          }
        }
      }
    }

    if (Object.keys(updateObj).length > 0) {
      user = await User.findByIdAndUpdate(userId, { $set: updateObj }, { new: true, lean: true });
    }

    const whatsAppPrices = await Logics.getWhatsAppPrices({ countryCode: user.countryCode });

    const responseData = { notificationOptions: user.notificationOptions, whatsAppPrices };

    Base.successResponse(response, Const.responsecodeSucceed, responseData);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "NotificationOptionsController",
      error,
    });
  }
});

module.exports = router;
