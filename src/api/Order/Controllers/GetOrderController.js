"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { Order } = require("#models");
const { auth } = require("#middleware");

/**
 * @api {get} /api/v2/orders/:orderId Get order details flom_v1
 * @apiVersion 2.0.34
 * @apiName  Get order details flom_v1
 * @apiGroup WebAPI Order
 * @apiDescription  Get order details by order ID.
 *
 * @apiHeader {String} access-token Users unique access token
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1764245263992,
 *   "data": {
 *      "order": {
 *         "_id": String,
 *         "price": {
 *           "countryCode": String,
 *           "currency": String,
 *           "value": Number,
 *           "valueInSats": Number
 *         },
 *         "product": {
 *           "_id": String,
 *           "name": String,
 *           "condition": String,
 *           "file": {}
 *         },
 *         "sellerId": String,
 *         "buyerId": String,
 *         "auctionId": String,
 *         "transferId": String,
 *         "paymentMethod": String,
 *         "status": String,
 *         "transferToken": String,
 *         "quantity": Number,
 *         "shipping": {
 *           "origin": {
 *             "name": String,
 *             "country": String,
 *             "countryCode": String,
 *             "region": String,
 *             "regionCode": String,
 *             "city": String,
 *             "road": String,
 *             "houseNumber": String,
 *             "postCode": String,
 *             "isDefault": Boolean,
 *           },
 *           "destination": {
 *             "name": String,
 *             "country": String,
 *             "countryCode": String,
 *             "region": String,
 *             "regionCode": String,
 *             "city": String,
 *             "road": String,
 *             "houseNumber": String,
 *             "postCode": String,
 *             "isDefault": Boolean,
 *           },
 *           "provider": String,
 *           "trackingNumber": String,
 *         },
 *         "events": [{
 *           "event": String,
 *           "user": String,
 *           "userId": String,
 *           "timeStamp": Number,
 *         }],
 *         "created": Number,
 *         "modified": Number,
 *       }
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
 * @apiError (Errors) 4000007 Token invalid
 */

router.get("/:orderId", auth({ allowUser: true }), async function (request, response) {
  try {
    const orderId = request.params.orderId;
    const { user } = request;
    const userId = user._id.toString();

    const order = await Order.findOne({
      _id: orderId,
      $or: [{ sellerId: userId }, { buyerId: userId }],
    }).lean();

    if (!order) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeOrderNotFound,
        message: "GetOrderController, get order details - order not found: " + orderId,
      });
    }

    const responseData = { order };
    Base.successResponse(response, Const.responsecodeSucceed, responseData);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "GetOrderController, get order details",
      error,
    });
  }
});

/**
 * @api {get} /api/v2/orders Get order list flom_v1
 * @apiVersion 2.0.34
 * @apiName  Get order list flom_v1
 * @apiGroup WebAPI Order
 * @apiDescription  Get order list, sold/purchased/payment pending.
 *
 * @apiHeader {String} access-token Users unique access token
 *
 * @apiParam (Query string) {String} type  Type of orders to return: "sold", "purchased", "payment_pending"
 * @apiParam (Query string) {Number} page  Page number for pagination (default: 1)
 * @apiParam (Query string) {Number} size  Number of orders per page (default: 10)
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1764245263992,
 *   "data": {
 *      "orders": [{
 *         "_id": String,
 *         "price": {
 *           "countryCode": String,
 *           "currency": String,
 *           "value": Number,
 *           "valueInSats": Number
 *         },
 *         "product": {
 *           "_id": String,
 *           "name": String,
 *           "condition": String,
 *           "file": {}
 *         },
 *         "sellerId": String,
 *         "buyerId": String,
 *         "auctionId": String,
 *         "transferId": String,
 *         "paymentMethod": String,
 *         "status": String,
 *         "transferToken": String,
 *         "quantity": Number,
 *         "shipping": {
 *           "origin": {
 *             "name": String,
 *             "country": String,
 *             "countryCode": String,
 *             "region": String,
 *             "regionCode": String,
 *             "city": String,
 *             "road": String,
 *             "houseNumber": String,
 *             "postCode": String,
 *             "isDefault": Boolean,
 *           },
 *           "destination": {
 *             "name": String,
 *             "country": String,
 *             "countryCode": String,
 *             "region": String,
 *             "regionCode": String,
 *             "city": String,
 *             "road": String,
 *             "houseNumber": String,
 *             "postCode": String,
 *             "isDefault": Boolean,
 *           },
 *           "provider": String,
 *           "trackingNumber": String,
 *         },
 *         "events": [{
 *           "event": String,
 *           "user": String,
 *           "userId": String,
 *           "timeStamp": Number
 *         }],
 *         "created": Number,
 *         "modified": Number,
 *       }],
 *      "paginationData": {
 *          "page": 1,
 *          "size": 1,
 *          "total": 208,
 *          "hasNext": true
 *      }
 *    }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443226 Invalid type parameter
 * @apiError (Errors) 4000007 Token invalid
 */

router.get("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const { type, page: p, size: s } = request.query;

    if (!type || (type !== "sold" && type !== "purchased" && type !== "payment_pending")) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidTypeParameter,
        message: "GetOrderController, get order list - invalid type: " + type,
      });
    }

    const page = !p || +p < 1 ? 1 : parseInt(+p);
    const size = !s || +s < 1 ? Const.newPagingRows : parseInt(+s);

    const userId = request.user._id.toString();
    let query;
    if (type === "sold") {
      query = { sellerId: userId };
    } else if (type === "purchased") {
      query = { buyerId: userId };
    } else if (type === "payment_pending") {
      query = { buyerId: userId, status: Const.orderStatus.PAYMENT_PENDING };
    }
    const orders = await Order.find(query)
      .sort({ created: -1 })
      .skip((page - 1) * size)
      .limit(size)
      .lean();

    const total = await Order.countDocuments(query);
    const hasNext = page * size < total;
    const paginationData = { page, size, total, hasNext };

    const responseData = { orders: !orders ? [] : orders, paginationData };
    Base.successResponse(response, Const.responsecodeSucceed, responseData);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "GetOrderController, get order list",
      error,
    });
  }
});

module.exports = router;
