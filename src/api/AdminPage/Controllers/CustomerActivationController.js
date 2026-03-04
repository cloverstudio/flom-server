"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { Configuration } = require("#models");

/**
 * @api {post} /api/v2/admin-page/customer-activation Send customer activation settings flom_v1
 * @apiVersion 2.0.10
 * @apiName  Send customer activation settings flom_v1
 * @apiGroup WebAPI Customer Activation
 * @apiDescription  API updates customer activation settings.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiParam {Number}  [totalSpendingCap]                          Total spending limit for bonus airtime data packets
 * @apiParam {Number}  [maxAmountPerUser]                          Maximum allowed amount for buying individual user bonus airtime packet
 * @apiParam {Boolean} [sendInviteToNgNumbers]                     Turn sending invite SMS messages to Nigerian non-Flom users on or off
 * @apiParam {Boolean} [sendInviteToNonNgNumbers]                  Turn sending invite SMS messages to non-Nigerian non-Flom users on or off
 * @apiParam {Boolean} [sendDataForSync]                           Turn data for sync on or off
 * @apiParam {Boolean} [sendDataForFirstPaymentOrApprovedProduct]  Turn data for first payment or approved product on or off
 * @apiParam {Boolean} [sendPayoutBonus]                           Turn payout bonuses on or off
 * @apiParam {Boolean} [sendSmsNotificationForBonus]               Turn sending SMS for notification after receiving bonus on or off
 * @apiParam {Number}  [merchApplApprovalAmount]                   Amount sent to user after approving merchant application (in USD)
 * @apiParam {Number}  [expoApprovalAmount]                        Amount sent to user after approving expo (in USD)
 * @apiParam {Number}  [videoApprovalAmount]                       Amount sent to user after approving video (in USD)
 * @apiParam {Number}  [audioApprovalAmount]                       Amount sent to user after approving audio (in USD)
 * @apiParam {Number}  [textApprovalAmount]                        Amount sent to user after approving text (in USD)
 * @apiParam {Number}  [maxProductBonusPayoutAmount]               Maximum amount sent to user for product (expo, video, audio, text) approvals (in USD)
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1660731589933,
 *     "data": {
 *         "updatedValues": {
 *             "merchApplApprovalAmount": 5,
 *             "expoApprovalAmount": 5,
 *             "videoApprovalAmount": 5,
 *             "sendSmsNotificationForBonus": true,
 *         }
 *     }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443801 Invalid parameter
 * @apiError (Errors) 4000007 Token invalid
 */

router.post("/", auth({ allowAdmin: true, role: Const.Role.ADMIN }), async (request, response) => {
  try {
    const updateObj = {},
      updatedValues = {};

    const vars = {
      totalSpendingCap: "number",
      maxAmountPerUser: "number",
      sendInviteToNgNumbers: "boolean",
      sendInviteToNonNgNumbers: "boolean",
      sendDataForSync: "boolean",
      sendDataForFirstPaymentOrApprovedProduct: "boolean",
      sendPayoutBonus: "boolean",
      sendSmsNotificationForBonus: "boolean",
      merchApplApprovalAmount: "number",
      expoApprovalAmount: "number",
      videoApprovalAmount: "number",
      audioApprovalAmount: "number",
      textApprovalAmount: "number",
      maxProductBonusPayoutAmount: "number",
    };

    for (const key in vars) {
      if (request.body[key] !== undefined && typeof request.body[key] !== vars[key]) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidCountryCode,
          message: `CustomerActivationController, POST - invalid parameter: ${key}`,
          param: key,
        });
      } else if (request.body[key] !== undefined && typeof request.body[key] === vars[key]) {
        updateObj[`properties.${key}`] = request.body[key];
        updatedValues[key] = request.body[key];
      }
    }

    await Configuration.updateOne({ type: "general", name: "customer-activation" }, updateObj);

    Base.successResponse(response, Const.responsecodeSucceed, { updatedValues });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "CustomerActivationController, POST",
      error,
    });
  }
});

/**
 * @api {get} /api/v2/admin-page/customer-activation Get customer activation settings flom_v1
 * @apiVersion 2.0.10
 * @apiName  Get customer activation settings flom_v1
 * @apiGroup WebAPI Customer Activation
 * @apiDescription  API fetches customer activation settings.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiParam (Query string) {Number} [startDate]  UTC date in milliseconds from start of era. If this param is sent all spending is calculated from that date until today.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1660731589933,
 *     "data": {
 *         "customerActivationData": {
 *             "totalSpendingCap": 25000,
 *             "totalSpending": 3468,
 *             "sendDataForSync": true,
 *             "dataForSyncSpending": 1000,
 *             "sendDataForFirstPaymentOrApprovedProduct": true,
 *             "dataForFirstPaymentOrApprovedProductSpending": 1000,
 *             "sendPayoutBonus": true,
 *             "smsInviteSpending": 234,
 *             "smsAdminSpending": 234,
 *             "maxAmountPerUser": 2,
 *             "sendInviteToNgNumbers": true,
 *             "sendInviteToNonNgNumbers": false,
 *             "sendSmsNotificationForBonus": true
 *             "merchApplApprovalAmount": 5,
 *             "expoApprovalAmount": 5,
 *             "videoApprovalAmount": 5,
 *             "audioApprovalAmount": 5,
 *             "textApprovalAmount": 5,
 *             "maxProductBonusPayoutAmount": 5,
 *             "lastResetDate": 0,
 *         }
 *     }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 4000007 Token invalid
 */

router.get("/", auth({ allowAdmin: true, role: Const.Role.ADMIN }), async (request, response) => {
  try {
    let startDate = !request.query.startDate
      ? undefined
      : isNaN(+request.query.startDate)
      ? undefined
      : +request.query.startDate;

    const customerActivationData = await Utils.getCustomerActivationData({
      dateLimit: startDate,
    });

    Base.successResponse(response, Const.responsecodeSucceed, { customerActivationData });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "CustomerActivationController, GET",
      error,
    });
  }
});

/**
 * @api {get} /api/v2/admin-page/customer-activation/reset Reset total spending flom_v1
 * @apiVersion 2.0.10
 * @apiName  Reset total spending flom_v1
 * @apiGroup WebAPI Customer Activation
 * @apiDescription  API resets the total spent amount.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1660731589933
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 4000007 Token invalid
 */

router.get(
  "/reset-total",
  auth({ allowAdmin: true, role: Const.Role.ADMIN }),
  async (request, response) => {
    try {
      await Configuration.updateOne(
        { type: "general", name: "customer-activation" },
        { "properties.lastResetDate": Date.now() },
      );

      Base.successResponse(response, Const.responsecodeSucceed);
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "CustomerActivationController, reset total",
        error,
      });
    }
  },
);

module.exports = router;
