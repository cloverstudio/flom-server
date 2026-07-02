"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const, countries } = require("#config");
const Utils = require("#utils");
const Logics = require("#logics");
const { auth } = require("#middleware");
const { User, Order, ConversionRate, History, Room, FlomMessage } = require("#models");

/**
 * @api {get} /api/v2/inbox Get users inbox flom_v1
 * @apiVersion 2.0.34
 * @apiName Get Users Inbox
 * @apiGroup WebAPI Inbox
 * @apiDescription API for retrieving user's inbox
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam (Query string) {String} type   Type of inbox to return: "waiting", "follow_up", "paid", "all"
 *
 * @apiSuccessExample {json} Success Response
 * {
 *     "code": 1,
 *     "time": 1782980250262,
 *     "data": {
 *         "histories": [
 *             {
 *                 "_id": "6435096b56fb1a5be749509f",
 *                 "userId": "63e3771e2a439852f927d4a0",
 *                 "chatId": "63dceca0c30542684f1b7b68",
 *                 "chatType": 1,
 *                 "lastUpdate": 1782909779810,
 *                 "lastUpdateUser": {
 *                     "_id": "63dceca0c30542684f1b7b68",
 *                     "bankAccounts": [
 *                         {
 *                             "name": "SampleAcc",
 *                             "accountNumber": "1503567574679",
 *                             "code": "",
 *                             "merchantCode": "40200168",
 *                             "selected": true,
 *                             "lightningUserName": "40200168",
 *                             "lightningAddress": "40200168@flom.dev",
 *                             "lightningUrlEncoded": "LNURL1DP68GURN8GHJ7ENVDAKJUER9WCHJUAM9D3KZ66MWDAMKUTMVDE6HYMRS9U6RQV3SXQCNVWQV2YVW6"
 *                         }
 *                     ],
 *                     "name": "mer19abc",
 *                     "organizationId": "5caf3119ec0abb18999bd753",
 *                     "created": 1675422880810,
 *                     "phoneNumber": "+2348020000019",
 *                     "description": "kgkvkvkvlbjvjvkvkvjvjv kvkvkvkv ist eine von den meisten anderen",
 *                     "avatar": {
 *                         "picture": {
 *                             "originalName": "thumb_n38hIbTQpmLT_1724400654916.jpg",
 *                             "size": 43868,
 *                             "mimeType": "image/png",
 *                             "nameOnServer": "eN3zSN1c5jjhdFnkVVY98KbDV2ZjGvO9"
 *                         },
 *                         "thumbnail": {
 *                             "originalName": "thumb_n38hIbTQpmLT_1724400654916.jpg",
 *                             "size": 55598,
 *                             "mimeType": "image/png",
 *                             "nameOnServer": "SofEJ4ki2ilzECEYnD2QjI0fV6GZMtu1"
 *                         }
 *                     },
 *                     "whatsApp": {
 *                         "reference": "DBuUjflIKP"
 *                     },
 *                     "slug": "mer19abc"
 *                 },
 *                 "lastMessage": {
 *                     "messageId": "6a450b536cf5e63f09c5dcd8",
 *                     "message": " Ovkg",
 *                     "created": 1782909779692,
 *                     "type": 1,
 *                     "sentTo": [
 *                         "63e3771e2a439852f927d4a0"
 *                     ],
 *                     "delivered": true
 *                 },
 *                 "keyword": "mer19abc,  Ovkg",
 *                 "unreadCount": 1,
 *                 "firstMessageUserId": "63e3771e2a439852f927d4a0",
 *                 "__v": 0,
 *                 "lastUpdateUnreadCount": 1782909676190,
 *                 "channel": "internal",
 *                 "updatedAt": "2026-07-01T12:42:59.990Z",
 *                 "orderStatus": "expired",
 *                 "orderPrice": {
 *                     "countryCode": "NG",
 *                     "currency": "NGN",
 *                     "value": 1010
 *                 },
 *                 "user": {
 *                     "_id": "63dceca0c30542684f1b7b68",
 *                     "bankAccounts": [
 *                         {
 *                             "name": "SampleAcc",
 *                             "accountNumber": "1503567574679",
 *                             "code": "",
 *                             "merchantCode": "40200168",
 *                             "selected": true,
 *                             "lightningUserName": "40200168",
 *                             "lightningAddress": "40200168@flom.dev",
 *                             "lightningUrlEncoded": "LNURL1DP68GURN8GHJ7ENVDAKJUER9WCHJUAM9D3KZ66MWDAMKUTMVDE6HYMRS9U6RQV3SXQCNVWQV2YVW6"
 *                         }
 *                     ],
 *                     "created": 1675422880810,
 *                     "phoneNumber": "+2348020000019",
 *                     "userName": "mer19abc",
 *                     "avatar": {
 *                         "picture": {
 *                             "originalName": "thumb_n38hIbTQpmLT_1724400654916.jpg",
 *                             "size": 43868,
 *                             "mimeType": "image/png",
 *                             "nameOnServer": "eN3zSN1c5jjhdFnkVVY98KbDV2ZjGvO9"
 *                         },
 *                         "thumbnail": {
 *                             "originalName": "thumb_n38hIbTQpmLT_1724400654916.jpg",
 *                             "size": 55598,
 *                             "mimeType": "image/png",
 *                             "nameOnServer": "SofEJ4ki2ilzECEYnD2QjI0fV6GZMtu1"
 *                         }
 *                     },
 *                     "onlineStatus": null,
 *                     "lastSeen": 1782936199640
 *                 }
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

async function getInbox({ user, type, page, size }) {
  try {
    const userId = user._id.toString();

    if (!type || !["waiting", "follow_up", "paid", "all"].includes(type)) {
      return { errCode: Const.responsecodeInvalidTypeParameter, errMsg: "invalid type: " + type };
    }

    const query = { "seller._id": userId };

    switch (type) {
      case "waiting":
        query.status = {
          $in: [Const.orderStatus.PAYMENT_PENDING, Const.orderStatus.PAYMENT_FAILED],
        };
        break;
      case "follow_up":
        query.status = { $in: [Const.orderStatus.PAYMENT_COMPLETED, Const.orderStatus.SHIPPED] };
        break;
      case "paid":
        query.status = {
          $in: [Const.orderStatus.PAYMENT_COMPLETED, Const.orderStatus.SHIPPED],
        };
        break;
      case "all":
        query.status = {
          $nin: [
            Const.orderStatus.DELIVERED,
            Const.orderStatus.CLOSED_BY_SUPPORT,
            Const.orderStatus.CANCELED,
          ],
        };
        break;
    }

    const orders = await Order.find(query).sort({ createdAt: -1 }).lean();

    const existingBuyerIds = [];
    const orderToBuyerIdMap = {};
    const mostRecentOrdersForUniqueBuyers = orders.filter((order) => {
      const shouldInclude = !existingBuyerIds.includes(order.buyer._id);
      if (shouldInclude) {
        existingBuyerIds.push(order.buyer._id);
        orderToBuyerIdMap[order.buyer._id] = order;
      }
      return shouldInclude;
    });

    const uniqueBuyerIds = Array.from(new Set(existingBuyerIds));
    const histories = await History.find({ userId, chatId: { $in: uniqueBuyerIds }, chatType: 1 })
      .sort({ lastUpdate: -1 })
      .lean();

    const otherUsers = await User.find(
      { _id: { $in: uniqueBuyerIds } },
      { _id: 1, userName: 1, created: 1, phoneNumber: 1, avatar: 1, bankAccounts: 1 },
    ).lean();
    const otherUsersMap = {};
    otherUsers.forEach((otherUser) => {
      otherUsersMap[otherUser._id.toString()] = otherUser;
    });

    const onlineStatuses = await Logics.getUsersOnlineStatus(uniqueBuyerIds);

    histories.forEach((history) => {
      history.orderStatus = orderToBuyerIdMap[history.chatId]?.status || null;
      history.orderPrice = orderToBuyerIdMap[history.chatId]?.price || null;
      history.user = otherUsersMap[history.chatId] || null;
      if (history.user) {
        history.user._id = history.user._id.toString();

        const onlineStatusObj = onlineStatuses.find((status) => status.userId === history.chatId);
        if (onlineStatusObj) {
          history.user.onlineStatus = onlineStatusObj.onlineStatus;
          history.user.lastSeen = onlineStatusObj.lastSeen || null;
        } else {
          history.user.onlineStatus = null;
          history.user.lastSeen = null;
        }
      }
    });

    return { histories };
  } catch (error) {
    logger.error("InboxController, getInbox", error);
    return { histories: [] };
  }
}

module.exports = router;
