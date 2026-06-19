"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, countries } = require("#config");
const Utils = require("#utils");
const Logics = require("#logics");
const { auth } = require("#middleware");
const { User, Order, ConversionRate, History } = require("#models");

/**
 * @api {get} /api/v2/inbox Get users inbox flom_v1
 * @apiVersion 2.0.34
 * @apiName Get Users Inbox
 * @apiGroup WebAPI Inbox
 * @apiDescription API for retrieving user's inbox
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam (Query string) {String}  type  Type of inbox to return: "waiting", "follow_up", "paid"
 *
 * @apiSuccessExample {json} Success Response
 * {
 *     "code": 1,
 *     "time": 1781859350805,
 *     "data": {
 *         "histories": [
 *             {
 *                 "_id": "63ea1ba1eceafa20d4cf59c5",
 *                 "userId": "63dceca0c30542684f1b7b68",
 *                 "chatId": "63dccc42bcc5921af87df5ce",
 *                 "chatType": 1,
 *                 "lastUpdate": 1776846399853,
 *                 "lastUpdateUser": {
 *                     "_id": "63dccc42bcc5921af87df5ce",
 *                     "bankAccounts": [
 *                         {
 *                             "name": "Global",
 *                             "accountNumber": "1234567890",
 *                             "code": "011",
 *                             "merchantCode": "16766337",
 *                             "selected": true,
 *                             "lightningUserName": "16766337",
 *                             "lightningAddress": "16766337@v2.flom.dev",
 *                             "lightningUrlEncoded": "LNURL1DP68GURN8GHJ7A3J9ENXCMMD9EJX2A309EMK2MRV944KUMMHDCHKCMN4WFK8QTE3XCMNVD3NXVMSFNA96T"
 *                         }
 *                     ],
 *                     "name": "Major_Kira_Nerys",
 *                     "organizationId": "5caf3119ec0abb18999bd753",
 *                     "created": 1675414594155,
 *                     "phoneNumber": "+2347087677188",
 *                     "avatar": {
 *                         "picture": {
 *                             "originalName": "imageA_1675429443.jpg",
 *                             "size": 311015,
 *                             "mimeType": "image/png",
 *                             "nameOnServer": "J86zLA5X85M2BKzuKyEUKeNnSm1SaO7H"
 *                         },
 *                         "thumbnail": {
 *                             "originalName": "imageA_1675429443.jpg",
 *                             "size": 100000,
 *                             "mimeType": "image/png",
 *                             "nameOnServer": "72QsCaJDcsJgXfEv8Svpe7g43cl1AMAP"
 *                         }
 *                     },
 *                     "description": "Plan 9 from Outer Space is a 1959 American science fiction film."
 *                 },
 *                 "lastMessage": {
 *                     "messageId": "69e8863f110f06c56efbdf22",
 *                     "message": "Hdjdd",
 *                     "created": 1776846399708,
 *                     "type": 1,
 *                     "sentTo": [
 *                         "63dceca0c30542684f1b7b68"
 *                     ],
 *                     "seen": true
 *                 },
 *                 "keyword": "Major_Kira_Nerys, Hdjdd",
 *                 "unreadCount": 0,
 *                 "firstMessageUserId": "63dccc42bcc5921af87df5ce",
 *                 "__v": 0,
 *                 "lastUpdateUnreadCount": 1776860195362,
 *                 "updatedAt": "2026-04-22T12:16:35.362Z",
 *                 "channel": "internal",
 *                 "orderStatus": "shipped"
 *             }
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
 * @apiError (Errors) 443226 Invalid type parameter
 * @apiError (Errors) 4000007 Token not valid
 */

router.get("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const { type } = request.query;

    const res = await getInbox({ user, type });

    if (res.errCode) {
      return Base.newErrorResponse({
        response,
        code: res.errCode,
        message: "InboxController, " + res.errMsg,
      });
    }

    const responseData = {
      histories: res.histories,
    };

    Base.successResponse(response, Const.responsecodeSucceed, responseData);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "InboxController",
      error,
    });
  }
});

async function getInbox({ user, type }) {
  const userId = user._id.toString();

  if (!type || !["waiting", "follow_up", "paid"].includes(type)) {
    return { errCode: Const.responsecodeInvalidTypeParameter, errMsg: "invalid type: " + type };
  }

  const query = { "seller._id": userId };

  switch (type) {
    case "waiting":
      query.status = {
        $in: [
          Const.orderStatus.PAYMENT_PENDING,
          Const.orderStatus.PAYMENT_FAILED,
          Const.orderStatus.SHIPPED,
          Const.orderStatus.CANCELLATION_REQUESTED,
          Const.orderStatus.SUPPORT_TICKET_OPENED,
        ],
      };
      break;
    case "follow_up":
      query.status = { $in: [Const.orderStatus.PAYMENT_COMPLETED] };
      break;
    case "paid":
      query.status = {
        $in: [
          Const.orderStatus.PAYMENT_COMPLETED,
          Const.orderStatus.SHIPPED,
          Const.orderStatus.CANCELLATION_REQUESTED,
          Const.orderStatus.SUPPORT_TICKET_OPENED,
        ],
      };
      break;
  }

  const orders = await Order.find(query).sort({ createdAt: -1 }).lean();

  const existingBuyerIds = [];
  const orderStatusToBuyerIdMap = {};
  const mostRecentOrdersForUniqueBuyers = orders.filter((order) => {
    const shouldInclude = !existingBuyerIds.includes(order.buyer._id);
    if (shouldInclude) {
      existingBuyerIds.push(order.buyer._id);
      orderStatusToBuyerIdMap[order.buyer._id] = order.status;
    }
    return shouldInclude;
  });

  const uniqueBuyerIds = Array.from(new Set(existingBuyerIds));
  const histories = await History.find({ userId, chatId: { $in: uniqueBuyerIds }, chatType: 1 })
    .sort({ lastUpdate: -1 })
    .lean();
  histories.forEach((history) => {
    history.orderStatus = orderStatusToBuyerIdMap[history.chatId] || null;
  });

  return { histories };
}

module.exports = router;
