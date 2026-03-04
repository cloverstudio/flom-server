"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { Order } = require("#models");
const { auth } = require("#middleware");

/**
 * @api {patch} /api/v2/orders/:orderId/cancel Cancel order flom_v1
 * @apiVersion 2.0.34
 * @apiName  Cancel order flom_v1
 * @apiGroup WebAPI Order
 * @apiDescription  Cancel order by order ID. Only buyer can cancel the order. Canceling an order will automatically refund the buyer if payment was completed. Canceling is not allowed after order is marked as shipped.
 *
 * @apiHeader {String} access-token Users or admins unique access token
 *
 * @apiParam (Request body) {String}  [cancellationReason]  Reason for cancellation (only if action is cancel)
 * @apiParam (Request body) {String}  [supportTicketId]     ID of support ticket (only if action is cancel)
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1764245263992,
 *   "data": {}
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 443940 Order not found
 * @apiError (Errors) 443941 Invalid order status, cannot cancel order after it is marked as shipped/completed/canceled/refunded
 * @apiError (Errors) 443858 User not allowed to cancel the order
 * @apiError (Errors) 4000007 Token invalid
 */

router.patch(
  "/:orderId",
  auth({
    allowUser: true,
    allowAdmin: true,
    includedRoles: [Const.Role.ADMIN, Const.Role.SUPER_ADMIN, Const.Role.SUPPORT_TICKET_REVIEWER],
  }),
  async function (request, response) {
    try {
      const { user, isAdmin } = request;
      const userId = user._id.toString();
      const { cancellationReason, supportTicketId } = request.body;

      const orderId = request.params.orderId;
      const order = await Order.findOne({
        _id: orderId,
        $or: [{ sellerId: userId }, { buyerId: userId }],
      }).lean();

      if (!order) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeOrderNotFound,
          message: "CancelOrderController, order not found: " + orderId,
        });
      }

      const relation = isAdmin ? "admin" : order.sellerId === userId ? "seller" : "buyer";

      if (relation === "seller") {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeUserNotAllowed,
          message: "CancelOrderController, Seller cannot cancel order",
        });
      }
      if (
        [
          Const.orderStatus.SHIPPED,
          Const.orderStatus.COMPLETED,
          Const.orderStatus.CLOSED,
          Const.orderStatus.CANCELED_REFUNDED,
        ].includes(order.status)
      ) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidOrderStatus,
          message:
            "CancelOrderController, Cannot cancel order after it is marked as shipped/completed/canceled/refunded",
        });
      }

      const updatedOrder = await Order.findByIdAndUpdate(
        order._id,
        {
          $set: {
            status: Const.orderStatus.CANCELED_REFUNDED,
            cancellationReason,
            supportTicketId,
            modified: Date.now(),
          },
          $push: {
            events: {
              event: Const.orderEvent.ORDER_CANCELLED_REFUNDED,
              user: relation,
              userId,
              timeStamp: Date.now(),
            },
          },
        },
        { new: true, lean: true },
      );

      //const responseData = { updatedOrder };
      Base.successResponse(response, Const.responsecodeSucceed, {});
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
