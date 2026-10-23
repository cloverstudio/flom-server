"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { Order, Auction, User, Product, Transfer } = require("#models");
const { auth } = require("#middleware");

/**
 * @api {get} /api/v2/orders/token/:token Get order details by token flom_v1
 * @apiVersion 2.0.34
 * @apiName  Get order details by token flom_v1
 * @apiGroup WebAPI Order
 * @apiDescription  Get order details by token. API is open.
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1764245263992,
 *   "data": {
 *      "transferToken": String, // Only included if order is from auction and payment is pending
 *      "order": OrderModel,
 *      "isBuyerSubscribed": false,
 *      "receiptData": {
 *          "id": "6acdfc6dd4327dbb5c9b0398",
 *          "_id": "6acdfc6dd4327dbb5c9b0398",
 *          "transferType": 4,
 *          "status": 3,
 *          "created": 1791884397318,
 *          "paymentMethodType": 9,
 *          "paymentMethodName": "PalmPay Wallet",
 *          "receiverCountryCode": "NG",
 *          "receiverPhoneNumber": "+234802******1",
 *          "senderCountryCode": "NG",
 *          "senderPhoneNumber": "+234802******2",
 *          "localAmountSender": {
 *              "countryCode": "NG",
 *              "currency": "NGN",
 *              "value": 100
 *          },
 *          "localProcessingFee": {
 *              "countryCode": "NG",
 *              "currency": "NGN",
 *              "value": 0
 *          },
 *          "localTaxAmount": {
 *              "countryCode": "NG",
 *              "currency": "NGN",
 *              "value": 7.5
 *          },
 *          "taxRate": 0.075,
 *          "basket": [
 *              {
 *                  "id": "6a0ed07ef5b07eeb308e3408",
 *                  "quantity": 1,
 *                  "pricePerItem": 0.13,
 *                  "originalPrice": {
 *                      "countryCode": "NG",
 *                      "currency": "NGN",
 *                      "value": 100
 *                  },
 *                  "localAmountSender": {
 *                      "countryCode": "NG",
 *                      "currency": "NGN",
 *                      "value": 100
 *                  },
 *                  "localAmountReceiver": {
 *                      "countryCode": "NG",
 *                      "currency": "NGN",
 *                      "value": 100
 *                  },
 *                  "name": "Test xz"
 *              }
 *          ]
 *      }
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

router.get("/token/:token", async function (request, response) {
  try {
    const token = request.params.token;

    if (!token) {
      return Base.errorResponse({
        response,
        code: Const.responsecodeOrderNotFound,
        message: "GetOrderController, get order details by token - invalid order token: " + token,
      });
    }

    const order = await Order.findOne({ orderToken: token }).lean();

    if (!order) {
      return Base.errorResponse({
        response,
        code: Const.responsecodeOrderNotFound,
        message:
          "GetOrderController, get order details by token - order not found for order token: " +
          token,
      });
    }

    if (order.product) {
      order.products = [order.product];
      delete order.product;
    }

    if (order.shipping?.origin) {
      delete order.shipping.origin;
    }
    if (order.shipping?.destination) {
      delete order.shipping.destination;
    }
    if (order.seller.phoneNumber) {
      order.seller.phoneNumber = Utils.maskPhoneNumber(order.seller.phoneNumber);
    }
    if (order.buyer.phoneNumber) {
      order.buyer.phoneNumber = Utils.maskPhoneNumber(order.buyer.phoneNumber);
    }

    const responseData = { order, isBuyerSubscribed: false };

    if (order.auctionId && order.status === Const.orderStatus.PAYMENT_PENDING) {
      const auction = await Auction.findById(order.auctionId).lean();
      if (auction) {
        responseData.transferToken = auction.transferToken;
      }
    }

    const productIds = order.products ? order.products.map((product) => product._id) : [];
    const products = await Product.find({ _id: { $in: productIds } }, { originalPrice: 1 }).lean();
    const productMap = {};
    products.forEach((product) => {
      productMap[product._id.toString()] = product.originalPrice;
    });

    order.products.forEach((product) => {
      product.originalPrice = productMap[product._id.toString()] || null;
    });

    const sellerId = order.seller._id.toString();
    const buyerId = order.buyer._id.toString();

    const b = await User.findById(buyerId, { followedBusinesses: 1 }).lean();
    if ((b?.followedBusinesses || []).includes(sellerId)) {
      responseData.isBuyerSubscribed = true;
    }

    const transferId = order.transferId;
    if (transferId) {
      const transfer = await Transfer.findById(transferId).lean();
      if (transfer) {
        const receiptData = {
          id: transferId,
          _id: transferId,
          transferType: transfer.transferType,
          status: transfer.status,
          created: transfer.created,
          paymentMethodType: transfer.paymentMethodType,
          paymentMethodName: transfer.paymentMethodName,
          receiverCountryCode: transfer.receiverCountryCode,
          receiverPhoneNumber: Utils.maskPhoneNumber(transfer.receiverPhoneNumber),
          senderCountryCode: transfer.senderCountryCode,
          senderPhoneNumber: Utils.maskPhoneNumber(transfer.senderPhoneNumber),
          localAmountSender: transfer.localAmountSender,
          localProcessingFee: transfer.localProcessingFee,
          localTaxAmount: transfer.localTaxAmount,
          taxRate: transfer.taxRate,
          totalAmount: transfer.totalAmount,
          basket: transfer.basket,
        };
        responseData.receiptData = receiptData;
      }
    }

    Base.successResponse(response, Const.responsecodeSucceed, responseData);
  } catch (error) {
    Base.errorResponse({
      response,
      message: "GetOrderController, get order details by token",
      error,
    });
  }
});

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
 *      "transferToken": String, // Only included if order is from auction and payment is pending
 *      "order": OrderModel
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

    if (!orderId || !Utils.isValidObjectId(orderId)) {
      return Base.errorResponse({
        response,
        code: Const.responsecodeOrderNotFound,
        message: "GetOrderController, get order details - invalid orderId: " + orderId,
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      $or: [{ "seller._id": userId }, { "buyer._id": userId }],
    }).lean();

    if (!order) {
      return Base.errorResponse({
        response,
        code: Const.responsecodeOrderNotFound,
        message: "GetOrderController, get order details - order not found: " + orderId,
      });
    }

    if (order.product) {
      order.products = [order.product];
      delete order.product;
    }

    const responseData = { order };

    if (order.auctionId && order.status === Const.orderStatus.PAYMENT_PENDING) {
      const auction = await Auction.findById(order.auctionId).lean();
      if (auction) {
        responseData.transferToken = auction.transferToken;
      }
    }

    Base.successResponse(response, Const.responsecodeSucceed, responseData);
  } catch (error) {
    Base.errorResponse({
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
 * @apiParam (Query string) {String} type      Type of orders to return: "sold", "purchased", "payment_pending"
 * @apiParam (Query string) {Number} [page]    Page number for pagination (default: 1)
 * @apiParam (Query string) {Number} [size]    Number of orders per page (default: 10)
 * @apiParam (Query string) {String} [search]  Seller or product name to filter orders (case insensitive)
 * @apiParam (Query string) {String} [status]  Order status to filter orders (case sensitive). If there are multiple values, split with a comma (,). Example: "status=payment_pending,shipped"
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1764245263992,
 *   "data": {
 *      "orders": [ OrderModel ],
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
    const { type, page: p, size: s, search } = request.query;
    const status = request.query.status ? request.query.status.split(",") : [];

    if (!type || (type !== "sold" && type !== "purchased" && type !== "payment_pending")) {
      return Base.errorResponse({
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
      query = { "seller._id": userId };
    } else if (type === "purchased") {
      query = { "buyer._id": userId };
    } else if (type === "payment_pending") {
      query = { "buyer._id": userId, status: Const.orderStatus.PAYMENT_PENDING };
    }

    if (search) {
      const sellerRegex = new RegExp(search, "i");
      const productRegex = new RegExp(search, "i");
      query["$or"] = [{ "seller.name": sellerRegex }, { "products.name": productRegex }];
    }
    if (status && status.length > 0) {
      query["status"] = { $in: status };
    }

    const orders = await Order.find(query)
      .sort({ created: -1 })
      .skip((page - 1) * size)
      .limit(size)
      .lean();

    const total = await Order.countDocuments(query);
    const hasNext = page * size < total;
    const paginationData = { page, size, total, hasNext };

    for (const order of orders) {
      if (order.product) {
        order.products = [order.product];
        delete order.product;
      }
    }

    const responseData = { orders: !orders ? [] : orders, paginationData };
    Base.successResponse(response, Const.responsecodeSucceed, responseData);
  } catch (error) {
    Base.errorResponse({
      response,
      message: "GetOrderController, get order list",
      error,
    });
  }
});

module.exports = router;
