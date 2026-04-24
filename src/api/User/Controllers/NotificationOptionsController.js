"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, countries } = require("#config");
const Utils = require("#utils");
const Logics = require("#logics");
const { auth } = require("#middleware");
const { User, SatsReservation, ConversionRate } = require("#models");

/**
 * @api {get} /api/v2/user/notification-options Get users notification options flom_v1
 * @apiVersion 2.0.34
 * @apiName Get users notification options flom_v1
 * @apiGroup WebAPI User
 * @apiDescription API for retrieving user notification options.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiSuccessExample {json} Success Response
 * {
 *     "code": 1,
 *     "time": 1776958269137,
 *     "data": {
 *         "notificationOptions": {
 *             "whatsApp": {
 *                 "enabled": false,
 *                 "enabledIntended": false,
 *                 "goLive": false,
 *                 "pendingPayment": false,
 *                 "shippingUpdate": false,
 *                 "secondChance": false,
 *                 "newDrop": false,
 *                 "auctionReminder": false,
 *                 "bookingConfirmation": false,
 *                 "bookingReminder": false
 *             },
 *             "push": {
 *                 "enabled": true,
 *                 "enabledIntended": true
 *             },
 *             "email": {
 *                 "enabled": true,
 *                 "enabledIntended": true
 *             },
 *             "sms": {
 *                 "enabled": false,
 *                 "enabledIntended": false
 *             }
 *         },
 *         "whatsAppPrices": {
 *             "countryCode": "HR",
 *             "marketing": 143, // sats price for marketing messages
 *             "utility": 36, // sats price for utility messages
 *             "currencyLocal": "EUR",
 *             "marketingLocal": 0.1,
 *             "utilityLocal": 0.02
 *         },
 *         "satsBalance": 918,
 *         "availableSatsBalance": 918,
 *         "localSatsBalance": {
 *             "countryCode": "HR",
 *             "currency": "EUR",
 *             "value": 0.61
 *         },
 *         "localAvailableSatsBalance": {
 *             "countryCode": "HR",
 *             "currency": "EUR",
 *             "value": 0.61
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

router.get("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const user = request.user;

    const satsBalance = !user.satsBalance || isNaN(user.satsBalance) ? 0 : user.satsBalance;
    const countryCode =
      user.countryCode || Utils.getCountryCodeFromPhoneNumber({ phoneNumber: user.phoneNumber });

    const opts = user.notificationOptions;

    const whatsAppPrices = await Logics.getWhatsAppPrices({ countryCode });

    const responseData = { notificationOptions: opts, whatsAppPrices };

    const satsReservations = await SatsReservation.find({
      userId: user.id,
      isActive: true,
      source: "flom_v1",
    }).lean();
    const reservedBalance = satsReservations.reduce(
      (acc, reservation) => acc + reservation.value,
      0,
    );
    const availableSatsBalance = satsBalance - reservedBalance;

    const conversionRates = await ConversionRate.find({}).sort({ date: -1 }).limit(1).lean();
    const satsRate =
      conversionRates && conversionRates.length > 0 ? conversionRates[0].rates["SAT"] : null;
    const currency = countries[countryCode] ? countries[countryCode].currency.split(",")[0] : null;
    const localRate =
      conversionRates && conversionRates.length > 0 && currency
        ? conversionRates[0].rates[currency]
        : null;

    if (satsRate && localRate) {
      responseData.satsBalance = satsBalance;
      responseData.availableSatsBalance = availableSatsBalance;

      responseData.localSatsBalance = {
        countryCode,
        currency,
        value: Utils.roundNumber(satsBalance * (localRate / satsRate), 2),
      };
      responseData.localAvailableSatsBalance = {
        countryCode,
        currency,
        value: Utils.roundNumber(availableSatsBalance * (localRate / satsRate), 2),
      };
    }

    Base.successResponse(response, Const.responsecodeSucceed, responseData);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "NotificationOptionsController",
      error,
    });
  }
});

/**
 * @api {patch} /api/v2/user/notification-options Update users notification options flom_v1
 * @apiVersion 2.0.34
 * @apiName Update users notification options flom_v1
 * @apiGroup WebAPI User
 * @apiDescription API for updating user notification options. Frontend sends only options that were changed, so all options are optional in the request body. For example, if user only wants to change goLive notifications, request body will look like this: { "whatsApp": { "goLive": true } }
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {Object}  [whatsApp]                     WhatsApp notification options
 * @apiParam {Boolean} [whatsApp.enabled]             Enable or disable WhatsApp notifications
 * @apiParam {Boolean} [whatsApp.goLive]              Enable or disable WhatsApp go live notifications
 * @apiParam {Boolean} [whatsApp.pendingPayment]      Enable or disable WhatsApp pending payment notifications
 * @apiParam {Boolean} [whatsApp.shippingUpdate]      Enable or disable WhatsApp shipping update notifications
 * @apiParam {Boolean} [whatsApp.secondChance]        Enable or disable WhatsApp second chance notifications
 * @apiParam {Boolean} [whatsApp.newDrop]             Enable or disable WhatsApp new drop notifications
 * @apiParam {Boolean} [whatsApp.auctionReminder]     Enable or disable WhatsApp auction reminder notifications
 * @apiParam {Boolean} [whatsApp.bookingConfirmation] Enable or disable WhatsApp booking confirmation notifications
 * @apiParam {Boolean} [whatsApp.bookingReminder]     Enable or disable WhatsApp booking reminder notifications
 * @apiParam {Object}  [push]                         Push notification options
 * @apiParam {Boolean} [push.enabled]                 Enable or disable push notifications
 * @apiParam {Object}  [email]                        Email notification options
 * @apiParam {Boolean} [email.enabled]                Enable or disable email notifications
 * @apiParam {Object}  [sms]                          SMS notification options
 * @apiParam {Boolean} [sms.enabled]                  Enable or disable SMS notifications
 *
 * @apiSuccessExample {json} Success Response
 * {
 *     "code": 1,
 *     "time": 1776958269137,
 *     "data": {
 *         "notificationOptions": {
 *             "whatsApp": {
 *                 "enabled": false,
 *                 "enabledIntended": false,
 *                 "goLive": false,
 *                 "pendingPayment": false,
 *                 "shippingUpdate": false,
 *                 "secondChance": false,
 *                 "newDrop": false,
 *                 "auctionReminder": false,
 *                 "bookingConfirmation": false,
 *                 "bookingReminder": false
 *             },
 *             "push": {
 *                 "enabled": true,
 *                 "enabledIntended": true
 *             },
 *             "email": {
 *                 "enabled": true,
 *                 "enabledIntended": true
 *             },
 *             "sms": {
 *                 "enabled": false,
 *                 "enabledIntended": false
 *             }
 *         },
 *         "whatsAppPrices": {
 *             "countryCode": "HR",
 *             "marketing": 143, // sats price for marketing messages
 *             "utility": 36, // sats price for utility messages
 *             "currencyLocal": "EUR",
 *             "marketingLocal": 0.1,
 *             "utilityLocal": 0.02
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

    const typeKeys = ["whatsApp", "push", "email", "sms"];

    const updateObj = {};

    for (const key in opts) {
      if (!typeKeys.includes(key)) continue;

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
