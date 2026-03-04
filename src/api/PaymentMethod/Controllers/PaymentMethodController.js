"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, Config } = require("#config");
const { PaymentMethod, User } = require("#models");
const { auth } = require("#middleware");

/**
 * @api {get} /api/v2/payment-methods/auctions  Get users auctions payment methods flom_v1
 * @apiVersion 2.0.33
 * @apiName Get users auctions payment methods flom_v1
 * @apiGroup WebAPI Payment method
 * @apiDescription Returns list of users auctions payment methods.
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiSuccessExample {json} Success Response
 * {
 *     "code": 1,
 *     "time": 1681382077013,
 *     "data": {
 *         "auctionPaymentMethods": [
 *             {
 *                 "type": "credit_card",
 *                 "displayName": "Credit card",
 *                 "selected": true
 *             },
 *             {
 *                 "type": "transfer",
 *                 "displayName": "Transfer",
 *                 "selected": false
 *             },
 *             {
 *                 "type": "global_balance",
 *                 "displayName": "Global balance",
 *                 "selected": false
 *             },
 *         ]
 *     }
 * }
 *
 **/

router.get("/auctions", auth({ allowUser: true }), async function (request, response) {
  try {
    const auctionPaymentMethods = Object.keys(Const.auctionPaymentMethodType)
      .map((key) => {
        const type = Const.auctionPaymentMethodType[key];
        const displayName = Const.auctionPaymentMethodName[key];

        return {
          type,
          displayName,
          selected: request.user.auctionPaymentMethod === type,
        };
      })
      .filter((method) => {
        if (
          method.type === Const.auctionPaymentMethodType.CREDIT_CARD &&
          request.user.countryCode === "NG"
        ) {
          return false;
        }
        if (
          method.type === Const.auctionPaymentMethodType.TRANSFER &&
          request.user.countryCode !== "NG"
        ) {
          return false;
        }

        return true;
      });

    Base.successResponse(response, Const.responsecodeSucceed, { auctionPaymentMethods });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "PaymentMethodController, get auction payment methods",
      error,
    });
  }
});

/**
 * @api {patch} /api/v2/payment-methods/auctions/deselect  Deselect users auctions payment method (dev only) flom_v1
 * @apiVersion 2.0.33
 * @apiName Deselect users auctions payment method flom_v1
 * @apiGroup WebAPI Payment method
 * @apiDescription Deselects users auctions payment method. Only used in development environment.
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiSuccessExample {json} Success Response
 * {
 *     "code": 1,
 *     "time": 1681382077013,
 *     "data": {}
 * }
 *
 * @apiError (Errors) 4000007 Token invalid
 *
 **/

router.patch("/auctions/deselect", auth({ allowUser: true }), async function (request, response) {
  try {
    if (Config.environment === "production") {
      return Base.successResponse(response, Const.responsecodeSucceed);
    }

    await User.findByIdAndUpdate(request.user._id, {
      $unset: { auctionPaymentMethod: 1, auctionPaymentMethodLocked: 1 },
    });

    Base.successResponse(response, Const.responsecodeSucceed);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "PaymentMethodController, deselect auction payment method",
      error,
    });
  }
});

/**
 * @api {patch} /api/v2/payment-methods/auctions Update users auctions payment method flom_v1
 * @apiVersion 2.0.33
 * @apiName Update users auctions payment method flom_v1
 * @apiGroup WebAPI Payment method
 * @apiDescription Updates users auctions payment method. possible values: credit_card, transfer, global_balance.
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiParam {String} methodType Type of payment method. Possible values: credit_card, transfer, global_balance
 *
 * @apiSuccessExample {json} Success Response
 * {
 *     "code": 1,
 *     "time": 1681382077013,
 *     "data": {}
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443092 Invalid payment method type
 * @apiError (Errors) 443094 Payment method type not available for user's country
 * @apiError (Errors) 443091 Payment method not found (no credit card added to payment profile / no global balance)
 * @apiError (Errors) 443095 User's auction payment method is locked
 * @apiError (Errors) 4000007 Token invalid
 *
 **/

router.patch("/auctions", auth({ allowUser: true }), async function (request, response) {
  try {
    const { methodType } = request.body;
    if (!methodType || !Object.values(Const.auctionPaymentMethodType).includes(methodType)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidPaymentMethod,
        message: "invalid payment method type",
        param: "methodType",
      });
    }

    if (request.user.auctionPaymentMethodLocked) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodePaymentMethodLockedForUser,
        message: "User's auction payment method is locked",
      });
    }

    if (
      (methodType === Const.auctionPaymentMethodType.CREDIT_CARD &&
        request.user.countryCode === "NG") ||
      (methodType === Const.auctionPaymentMethodType.TRANSFER && request.user.countryCode !== "NG")
    ) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodePaymentMethodNotAvailableForCountry,
        message: "Payment method type not available for user's country",
        param: "methodType",
      });
    }

    if (
      methodType === Const.auctionPaymentMethodType.CREDIT_CARD &&
      !request.user.paymentProfileId
    ) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodePaymentMethodNotFound,
        message: "User has no credit card added to payment profile",
      });
    }

    if (
      methodType === Const.auctionPaymentMethodType.GLOBAL_BALANCE &&
      request.user.satsBalance <= 0
    ) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodePaymentMethodNotFound,
        message: "User has no global balance",
      });
    }

    await User.findByIdAndUpdate(request.user._id, { auctionPaymentMethod: methodType });

    Base.successResponse(response, Const.responsecodeSucceed);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "PaymentMethodController, update auction payment method",
      error,
    });
  }
});

/**
 * @api {get} /api/v2/payment-methods Payment method info list flom_v1
 * @apiVersion 2.0.12
 * @apiName Payment method info list flom_v1
 * @apiGroup WebAPI Payment method
 * @apiDescription Returns list of payment methods info. Type 1 payment method is Credit card, type 2 is PayPal, type 3 is Bank account, type 4 is Credit balance.
 *
 * @apiHeader {String} UUID UUID of the device.
 *
 * @apiSuccessExample {json} Success Response
 * {
 *     "code": 1,
 *     "time": 1681382077013,
 *     "data": {
 *         "paymentMethods": [
 *             {
 *                 "_id": "5fa563f96e95d56069a64436",
 *                 "type": 1,
 *                 "name": "Credit card",
 *                 "fee": {
 *                     "percent": 0,
 *                     "flat": 0
 *                 },
 *                 "disabled": false,
 *                 "logoLink": "https://dev-old.flom.app/api/v2/payment-methods/logo/1",
 *                 "selected": true
 *             },
 *             {
 *                 "_id": "5fa564196e95d56069a64437",
 *                 "type": 2,
 *                 "name": "PayPal",
 *                 "fee": {
 *                     "percent": 0,
 *                     "flat": 0
 *                 },
 *                 "disabled": false,
 *                 "logoLink": "https://dev-old.flom.app/api/v2/payment-methods/logo/2",
 *                 "selected": false
 *             },
 *             {
 *                 "_id": "62a2ce332386a5c61a7e404b",
 *                 "type": 3,
 *                 "name": "Bank account",
 *                 "fee": {
 *                     "percent": 0,
 *                     "flat": 0
 *                 },
 *                 "disabled": false,
 *                 "logoLink": "https://dev-old.flom.app/api/v2/payment-methods/logo/3",
 *                 "selected": false
 *             },
 *             {
 *                 "_id": "6388bad3947e643e3efe4a0b",
 *                 "type": 4,
 *                 "name": "Credit balance",
 *                 "fee": {
 *                     "percent": 0,
 *                     "flat": 0
 *                 },
 *                 "disabled": false,
 *                 "logoLink": "https://dev-old.flom.app/api/v2/payment-methods/logo/4",
 *                 "selected": false
 *             }
 *         ]
 *     }
 * }
 *
 **/

router.get("/", async function (request, response) {
  try {
    const paymentMethods = await PaymentMethod.find().lean();

    paymentMethods.forEach((paymentMethod) => {
      paymentMethod.logoLink = `${Config.webClientUrl}/api/v2/payment-methods/logo/${paymentMethod.type}`;
      if (paymentMethod.type === Const.defaultPaymentMethodType) {
        paymentMethod.selected = true;
      } else {
        paymentMethod.selected = false;
      }
    });

    Base.successResponse(response, Const.responsecodeSucceed, { paymentMethods });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "PaymentMethodController",
      error,
    });
  }
});

module.exports = router;
