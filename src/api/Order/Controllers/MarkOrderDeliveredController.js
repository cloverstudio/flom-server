"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { Order } = require("#models");
const { auth } = require("#middleware");

/**
 * @api {patch} /api/v2/orders/:orderId/mark-delivered Mark order as delivered flom_v1
 * @apiVersion 2.0.34
 * @apiName  Mark order as delivered flom_v1
 * @apiGroup WebAPI Order
 * @apiDescription  Mark order as delivered by order ID.
 *
 * @apiHeader {String} access-token Users unique access token
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1764245263992,
 *   "data": {
 *     "order": OrderModel
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
 * @apiError (Errors) 443858 Seller cannot confirm delivery, only buyer can mark order as delivered
 * @apiError (Errors) 4000007 Token invalid
 */

router.patch(
  "/:orderId/mark-delivered",
  auth({
    allowUser: true,
  }),
  async function (request, response) {
    try {
      const { user } = request;
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
          message: "MarkOrderDeliveredController, order not found: " + orderId,
        });
      }

      const relation = order.sellerId === userId ? "seller" : "buyer";

      if (relation === "seller") {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeUserNotAllowed,
          message: "MarkOrderDeliveredController, seller cannot confirm delivery",
        });
      }

      const updatedOrder = await Order.findByIdAndUpdate(
        order._id,
        {
          $set: {
            status: Const.orderStatus.DELIVERED,
            modified: Date.now(),
          },
          $push: {
            events: {
              status: Const.orderStatus.DELIVERED,
              user: relation,
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
        message: "MarkOrderDeliveredController",
        error,
      });
    }
  },
);

module.exports = router;
