"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { Order } = require("#models");
const { auth } = require("#middleware");

/**
 * @api {patch} /api/v2/orders/:orderId/cancel  Cancel order flom_v1
 * @apiVersion 2.0.34
 * @apiName  Cancel order flom_v1
 * @apiGroup WebAPI Order
 * @apiDescription  Cancel order by order ID. Only admin (admin, super admin, support ticket reviewer) can cancel the order. Canceling an order will automatically refund the buyer if payment was completed.
 *
 * @apiHeader {String} access-token Admins unique access token
 *
 * @apiParam (Request body) {String}  [reason]  Reason for cancellation. Default is empty string.
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1764245263992,
 *   "data": {
 *      "order": OrderModel
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 443940 Order not found
 * @apiError (Errors) 443941 Invalid order status, cannot cancel order if it is not in cancellation_requested status
 * @apiError (Errors) 443858 User not allowed to cancel the order
 * @apiError (Errors) 4000007 Token invalid
 */

router.patch(
  "/:orderId/cancel",
  auth({
    allowAdmin: true,
    includedRoles: [Const.Role.ADMIN, Const.Role.SUPER_ADMIN, Const.Role.SUPPORT_TICKET_REVIEWER],
  }),
  async function (request, response) {
    try {
      const { user } = request;
      const userId = user._id.toString();
      let { reason = "" } = request.body;

      if (typeof reason !== "string") {
        reason = "";
      }

      const orderId = request.params.orderId;
      const order = await Order.findOne({ _id: orderId }).lean();

      if (!order) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeOrderNotFound,
          message: "CancelOrderController, order not found: " + orderId,
        });
      }

      if (order.status !== Const.orderStatus.CANCELLATION_REQUESTED) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidOrderStatus,
          message:
            "CancelOrderController, Cannot cancel order if status is not cancellation_requested, current status: " +
            order.status,
        });
      }

      const updatedOrder = await Order.findByIdAndUpdate(
        order._id,
        {
          $set: {
            status: Const.orderStatus.CANCELED,
            supportReason: reason,
            modified: Date.now(),
          },
          $push: {
            events: {
              status: Const.orderStatus.CANCELED,
              user: "admin",
              userId,
              timeStamp: Date.now(),
            },
          },
        },
        { new: true, lean: true },
      );

      const responseData = { order: updatedOrder };
      Base.successResponse(response, Const.responsecodeSucceed, responseData);
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "CancelOrderController",
        error,
      });
    }
  },
);

module.exports = router;
