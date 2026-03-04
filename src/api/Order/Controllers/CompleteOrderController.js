"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { Order } = require("#models");
const { auth } = require("#middleware");

/**
 * @api {patch} /api/v2/orders/:orderId/complete Complete order flom_v1
 * @apiVersion 2.0.34
 * @apiName  Complete order flom_v1
 * @apiGroup WebAPI Order
 * @apiDescription  Complete order by order ID.
 *
 * @apiHeader {String} access-token Users or admins unique access token
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
 * @apiError (Errors) 443858 User not allowed to complete the order
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

      const orderId = request.params.orderId;
      const order = await Order.findOne({
        _id: orderId,
        $or: [{ sellerId: userId }, { buyerId: userId }],
      }).lean();

      if (!order) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeOrderNotFound,
          message: "CompleteOrderController, order not found: " + orderId,
        });
      }

      const relation = isAdmin ? "admin" : order.sellerId === userId ? "seller" : "buyer";

      if (relation === "seller") {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeUserNotAllowed,
          message: "CompleteOrderController, seller cannot confirm delivery",
        });
      }
      if (relation === "buyer" && order.status !== Const.orderStatus.SHIPPED) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeUserNotAllowed,
          message: "CompleteOrderController, buyer cannot confirm delivery if order is not shipped",
        });
      }

      const updatedOrder = await Order.findByIdAndUpdate(
        order._id,
        {
          $set: {
            status: !isAdmin ? Const.orderStatus.COMPLETED : Const.orderStatus.CLOSED,
            modified: Date.now(),
          },
          $push: {
            events: {
              event: !isAdmin ? Const.orderEvent.ORDER_COMPLETED : Const.orderEvent.ORDER_CLOSED,
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
        message: "CompleteOrderController",
        error,
      });
    }
  },
);

module.exports = router;
