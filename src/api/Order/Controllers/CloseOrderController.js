"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { Order } = require("#models");
const { auth } = require("#middleware");

/**
 * @api {patch} /api/v2/orders/:orderId/close  Close order flom_v1
 * @apiVersion 2.0.34
 * @apiName  Close order flom_v1
 * @apiGroup WebAPI Order
 * @apiDescription  Close order by order ID. Only admin (admin, super admin, support ticket reviewer) can close the order. Closing an order will automatically refund the buyer if payment was completed. Closing an order happens when an issue ha sbeen opened and the admin finds reason to close it (item disputes etc.)
 *
 * @apiHeader {String} access-token Admins unique access token
 *
 * @apiParam (Request body) {String}  [reason]  Reason for closing the order. Default is empty string.
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
 * @apiError (Errors) 443941 Invalid order status, cannot close order if it is not in support_ticket_opened status
 * @apiError (Errors) 443858 User not allowed to close the order
 * @apiError (Errors) 4000007 Token invalid
 */

router.patch(
  "/:orderId/close",
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
          message: "CloseOrderController, order not found: " + orderId,
        });
      }

      if (order.status !== Const.orderStatus.SUPPORT_TICKET_OPENED) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidOrderStatus,
          message:
            "CloseOrderController, Cannot close order if status is not support_ticket_opened, current status: " +
            order.status,
        });
      }

      const updatedOrder = await Order.findByIdAndUpdate(
        order._id,
        {
          $set: {
            status: Const.orderStatus.CLOSED_BY_SUPPORT,
            supportReason: reason,
            modified: Date.now(),
          },
          $push: {
            events: {
              status: Const.orderStatus.CLOSED_BY_SUPPORT,
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
        message: "CloseOrderController",
        error,
      });
    }
  },
);

module.exports = router;
