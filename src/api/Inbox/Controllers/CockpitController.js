"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, countries } = require("#config");
const Utils = require("#utils");
const Logics = require("#logics");
const { auth } = require("#middleware");
const { User, Order, ConversionRate, History } = require("#models");

/**
 * @api {get} /api/v2/inbox/cockpit/to-reply Get latest business chats to reply flom_v1
 * @apiVersion 2.0.34
 * @apiName Get latest business chats to reply
 * @apiGroup WebAPI Inbox
 * @apiDescription API for retrieving the latest business chats that the user needs to reply to. Response is roomIds of the chats that the user needs to reply to, in descending order of last update time.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiSuccessExample {json} Success Response
 * {
 *     "code": 1,
 *     "time": 1789465909136,
 *     "data": {
 *         "roomIds": [
 *             "6-6a8fe7c1b95aff94f1357d28-63dcc7f3bcc5921af87df5c2"
 *         ]
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

router.get("/to-reply", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const userId = user._id.toString();

    const inactiveOrderStates = [
      Const.orderStatus.CANCELED,
      Const.orderStatus.CLOSED_BY_SUPPORT,
      Const.orderStatus.DELIVERED,
    ];

    const sellerOrders = await Order.find({
      "seller._id": userId,
      status: { $nin: inactiveOrderStates },
    })
      .sort({ created: -1 })
      .lean();

    if (!sellerOrders || sellerOrders.length === 0) {
      return Base.successResponse(response, Const.responsecodeSucceed, { userIds: [] });
    }

    const chatIds = Array.from(
      new Set(sellerOrders.map((order) => order.businessId + "-" + order.buyer._id)),
    );

    const historiesToReply = await History.find({
      chatType: Const.chatTypeBusiness,
      userId,
      chatId: { $in: chatIds },
      "lastUpdateUser._id": { $ne: user._id },
    })
      .sort({ lastUpdate: -1 })
      .lean();

    const responseData = {
      roomIds: historiesToReply.map((history) => `${Const.chatTypeBusiness}-${history.chatId}`),
    };

    Base.successResponse(response, Const.responsecodeSucceed, responseData);
  } catch (error) {
    Base.errorResponse({
      response,
      message: "CockpitController, get last chat to reply",
      error,
    });
  }
});

/**
 * @api {get} /api/v2/inbox/cockpit Get users cockpit flom_v1
 * @apiVersion 2.0.34
 * @apiName Get Users Cockpit
 * @apiGroup WebAPI Inbox
 * @apiDescription API for retrieving user's cockpit information
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiSuccessExample {json} Success Response
 * {
 *     "code": 1,
 *     "time": 1781780938007,
 *     "data": {
 *         "showCockpit": true,
 *         "pending": {
 *             "value": 0,
 *             "currency": "NGN"
 *         },
 *         "send": 0,
 *         "reply": 1
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
    const { user } = request;
    const userId = user._id.toString();

    const inactiveOrderStates = [
      Const.orderStatus.CANCELED,
      Const.orderStatus.CLOSED_BY_SUPPORT,
      Const.orderStatus.DELIVERED,
    ];

    const sellerOrders = await Order.find({
      "seller._id": userId,
      status: { $nin: inactiveOrderStates },
    })
      .sort({ created: -1 })
      .lean();

    if (!sellerOrders || sellerOrders.length === 0) {
      return Base.successResponse(response, Const.responsecodeSucceed, { showCockpit: false });
    }

    const responseData = { showCockpit: true };

    const paymentPendingOrders = sellerOrders.filter(
      (order) => order.status === Const.orderStatus.PAYMENT_PENDING,
    );
    let sum = 0;
    let conversionRates = await ConversionRate.getRates();

    for (let i = 0; i < paymentPendingOrders.length; i++) {
      let { convertedAmount, conversionRates: newRates } = await Logics.convertCurrency({
        amount: paymentPendingOrders[i].price.value,
        fromCountryCode: paymentPendingOrders[i].price.countryCode,
        toCountryCode: user.countryCode,
        conversionRates,
      });
      conversionRates = newRates;
      sum += convertedAmount;
    }

    responseData.pending = {
      value: Utils.roundNumber(sum, 2),
      currency: Utils.getCurrencyFromCountryCode({
        countryCode: user.countryCode,
        rates: conversionRates.rates,
      }),
    };

    const existingBuyerIds = [];
    const paymentCompletedOrders = sellerOrders.filter((order) => {
      const shouldInclude =
        order.status === Const.orderStatus.PAYMENT_COMPLETED &&
        !existingBuyerIds.includes(order.buyer._id);
      if (shouldInclude) {
        order.chatId = order.businessId + "-" + order.buyer._id;
        existingBuyerIds.push(order.buyer._id);
      }
      return shouldInclude;
    });

    responseData.send = paymentCompletedOrders.length;

    /* const uniqueBuyerIds = Array.from(new Set(sellerOrders.map((order) => order.buyer._id)));
    const historiesToReply = await History.find(
      {
        userId,
        chatId: { $in: uniqueBuyerIds },
        "lastUpdateUser._id": { $ne: user._id },
      },
      { _id: 1 },
    ).lean(); */

    const chatIds = Array.from(new Set(sellerOrders.map((order) => order.chatId)));
    const historiesToReply = await History.find(
      {
        chatType: Const.chatTypeBusiness,
        userId,
        chatId: { $in: chatIds },
        "lastUpdateUser._id": { $ne: user._id },
      },
      { _id: 1 },
    ).lean();

    responseData.reply = historiesToReply.length;

    Base.successResponse(response, Const.responsecodeSucceed, responseData);
  } catch (error) {
    Base.errorResponse({
      response,
      message: "CockpitController, get cockpit",
      error,
    });
  }
});

module.exports = router;
