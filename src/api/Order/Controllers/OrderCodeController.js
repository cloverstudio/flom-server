"use strict";

/**
 * @api {get} /api/v2/orders/token/:token/code Send code to order buyer flom_v1
 * @apiVersion 2.0.34
 * @apiName  Send code to order buyer flom_v1
 * @apiGroup WebAPI Order
 * @apiDescription  Send code to order buyer for the specified order token. API is open.
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1764245263992,
 *   "data": {
 *      "maskedBuyerPhoneNumber": String,
 *      "retryDelay": 45, // seconds
 *    }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 443940 Order not found
 * @apiError (Errors) 444014 Too many attempts
 * @apiError (Errors) 444015 Retry too soon
 * @apiError (Errors) 4000007 Token invalid
 */

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { Order, User, VerificationRequest } = require("#models");
const { WhatsApp: W } = require("#services");

const delayMap = {
  1: 45000, // 45 seconds delay
  2: 60000, // 60 seconds delay
};

router.get("/token/:token/code", async function (request, response) {
  try {
    const token = request.params.token;

    if (!token) {
      return Base.errorResponse({
        response,
        code: Const.responsecodeOrderNotFound,
        message: "OrderCodeController - invalid order token: " + token,
      });
    }

    const order = await Order.findOne({ orderToken: token }).lean();

    if (!order) {
      return Base.errorResponse({
        response,
        code: Const.responsecodeOrderNotFound,
        message: "OrderCodeController - order not found for order token: " + token,
      });
    }

    const buyerPhoneNumber = order.buyer.phoneNumber;
    const maskedBuyerPhoneNumber = buyerPhoneNumber
      ? Utils.maskPhoneNumber(buyerPhoneNumber)
      : null;

    const req = await VerificationRequest.findOne({
      phoneNumber: buyerPhoneNumber,
    }).lean();

    if (req && req.expiresAt > Date.now() && req.attempts >= 3) {
      return Base.errorResponse({
        response,
        code: Const.responsecodeTooManyAttempts,
        message: "OrderCodeController, too many attempts for phone number: " + buyerPhoneNumber,
      });
    }

    if (
      req &&
      req.expiresAt > Date.now() &&
      req.lastTryAt &&
      Date.now() - req.lastTryAt < delayMap[req.attempts]
    ) {
      return Base.errorResponse({
        response,
        code: Const.responsecodeRetryTooSoon,
        message: "OrderCodeController, retry too soon for phone number: " + buyerPhoneNumber,
      });
    }

    const code =
      Config.environment === "production" ? Utils.getRandomString(6, "numeric") : "555555";

    const buyer = await User.findOne({ phoneNumber: buyerPhoneNumber }).lean();
    let channel = "sms";
    if (buyer && buyer.whatsApp?.windowExpiresAt > Date.now()) {
      channel = "whatsApp";
    }

    let startOver = !req || req.expiresAt <= Date.now();

    const updatedReq = await VerificationRequest.findOneAndUpdate(
      { phoneNumber: buyerPhoneNumber },
      {
        phoneNumber: buyerPhoneNumber,
        channel: startOver ? channel : req.channel,
        code,
        attempts: startOver ? 1 : req.attempts + 1,
        expiresAt: startOver ? Date.now() + 15 * 60 * 1000 : req.expiresAt,
        lastTryAt: Date.now(),
      },
      { upsert: true, new: true },
    );

    let retryDelay = delayMap[updatedReq.attempts];
    if (!retryDelay) {
      retryDelay = updatedReq.expiresAt - Date.now();
    }

    const responseData = { maskedBuyerPhoneNumber, retryDelay: Math.floor(retryDelay / 1000) }; // convert to seconds
    Base.successResponse(response, Const.responsecodeSucceed, responseData);

    try {
      if (Config.environment === "production") {
        if (channel === "whatsApp") {
          console.log("OrderCodeController, sending WhatsApp message to:", buyerPhoneNumber);

          await W.send({
            to: buyerPhoneNumber,
            from: "flom",
            type: "service",
            message: `Your verification code for the order is: ${code}\nNever share this code, not even with the seller`,
            messageType: "text",
          });
        } else if (channel === "sms") {
          console.log("OrderCodeController, sending SMS to:", buyerPhoneNumber);

          await Utils.sendSMSv2({
            phoneNumber: buyerPhoneNumber,
            message: `Your verification code for the order is: ${code}\nNever share this code, not even with the seller`,
            type: "verification",
          });
        }
      }
    } catch (error) {
      logger.error("OrderCodeController, error sending verification code:", error);
    }
  } catch (error) {
    Base.errorResponse({
      response,
      message: "OrderCodeController",
      error,
    });
  }
});

module.exports = router;
