"use strict";

/**
 * @api {post} /api/v2/orders/generate-message Generate order message flom_v1
 * @apiVersion 2.0.35
 * @apiName  Generate order message flom_v1
 * @apiGroup WebAPI Order
 * @apiDescription  Generate a message for the order buyer based on the status of the order. For "shipped", "ship_by_expired", "cancellation_requested", "canceled", "support_ticket_opened", "closed_by_support" statuses a message is returned in response, for other statuses no message is generated and null is returned.
 *
 * @apiHeader {String} access-token Users unique access token
 *
 * @apiParam (Request body) {String}  orderId  ID of the order for which to generate the message.
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1764245263992,
 *   "data": {
 *      "message": "marko_04 has shipped Pair of socks."
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
 * @apiError (Errors) 443232 Invalid action - only the seller of the order can generate a message
 * @apiError (Errors) 4000007 Token invalid
 */

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { Order } = require("#models");
const Utils = require("#utils");
const { auth } = require("#middleware");

router.post("/generate-message", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;

    const orderId = request.body.orderId;

    if (!orderId || !Utils.isValidObjectId(orderId)) {
      return Base.errorResponse({
        response,
        code: Const.responsecodeOrderNotFound,
        message: "GenerateOrderMessageController - invalid order ID: " + orderId,
      });
    }

    const order = await Order.findById(orderId).lean();

    if (!order) {
      return Base.errorResponse({
        response,
        code: Const.responsecodeOrderNotFound,
        message: "GenerateOrderMessageController - order not found for order ID: " + orderId,
      });
    }

    if (user._id.toString() !== order.seller._id.toString()) {
      return Base.errorResponse({
        response,
        code: Const.responsecodeInvalidAction,
        message: "GenerateOrderMessageController - user not authorized for order ID: " + orderId,
      });
    }

    const sellerUserName = order.seller.userName;
    const productName =
      order.products.length > 1 ? `${order.products[0].name} and others` : order.products[0].name;

    let msg = null;

    switch (order.status) {
      case Const.orderStatus.SHIPPED:
        msg = `${sellerUserName} has shipped ${productName}.`;
        break;
      case Const.orderStatus.SHIP_BY_EXPIRED:
        msg = `${sellerUserName} failed to ship ${productName} on time.`;
        break;
      case Const.orderStatus.CANCELLATION_REQUESTED:
        msg = `Cancellation has been requested for ${productName}.`;
        break;
      case Const.orderStatus.CANCELED:
        msg = `The order for ${productName} has been canceled.`;
        break;
      case Const.orderStatus.SUPPORT_TICKET_OPENED:
        msg = `A support ticket has been opened for ${productName}.`;
        break;
      case Const.orderStatus.CLOSED_BY_SUPPORT:
        msg = `The order for ${productName} has been closed by support.`;
        break;
      default:
        break;
    }

    const responseData = { message: msg };
    Base.successResponse(response, Const.responsecodeSucceed, responseData);
  } catch (error) {
    Base.errorResponse({
      response,
      message: "GenerateOrderMessageController",
      error,
    });
  }
});

module.exports = router;
