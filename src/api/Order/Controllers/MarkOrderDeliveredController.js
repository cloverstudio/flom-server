"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Logics = require("#logics");
const { Order, Transfer } = require("#models");
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
  auth({ allowUser: true }),
  async function (request, response) {
    try {
      const { user } = request;
      const userId = !user ? null : user._id.toString();

      const orderId = request.params.orderId;
      const order = await Order.findById(orderId).lean();

      if (!order) {
        return Base.errorResponse({
          response,
          code: Const.responsecodeOrderNotFound,
          message: "MarkOrderDeliveredController, order not found: " + orderId,
        });
      }

      const relation = order.seller._id.toString() === userId ? "seller" : "buyer";

      if (relation === "seller") {
        return Base.errorResponse({
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
            deliveredAt: Date.now(),
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

      await Transfer.findByIdAndUpdate(order.transferId, {
        $set: { eligibleForPayout: true, releasedBy: userId },
      });

      const responseData = { order: updatedOrder };
      Base.successResponse(response, Const.responsecodeSucceed, responseData);
    } catch (error) {
      Base.errorResponse({
        response,
        message: "MarkOrderDeliveredController",
        error,
      });
    }
  },
);

/**
 * @api {post} /api/v2/orders/:token/mark-delivered/code Mark order as delivered with code flom_v1
 * @apiVersion 2.0.34
 * @apiName  Mark order as delivered flom_v1
 * @apiGroup WebAPI Order
 * @apiDescription  Mark order as delivered by order ID.
 *
 * @apiParam (Request body) {String}  code  SMS/Whatsapp code
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
 * @apiError (Errors) 444016 Invalid code
 * @apiError (Errors) 444017 Code expired
 * @apiError (Errors) 4000007 Token invalid
 */

router.post("/:token/mark-delivered/code", async function (request, response) {
  try {
    const token = request.params.token;
    const { code } = request.body;

    const {
      success,
      order,
      code: errorCode,
      msg,
    } = await Logics.confirmOrderCode({ orderToken: token, code });
    if (!success) {
      return Base.errorResponse({
        response,
        code: errorCode,
        message: "MarkOrderDeliveredController code, " + msg,
      });
    }

    const relation = "buyer";

    const updatedOrder = await Order.findByIdAndUpdate(
      order._id,
      {
        $set: {
          status: Const.orderStatus.DELIVERED,
          modified: Date.now(),
          deliveredAt: Date.now(),
          releasedBy: order.buyer._id,
        },
        $push: {
          events: {
            status: Const.orderStatus.DELIVERED,
            user: relation,
            userId: null,
            timeStamp: Date.now(),
          },
        },
      },
      { new: true, lean: true },
    );

    await Transfer.findByIdAndUpdate(order.transferId, {
      $set: { eligibleForPayout: true, releasedBy: order.buyer._id },
    });

    const responseData = {};
    Base.successResponse(response, Const.responsecodeSucceed, responseData);
  } catch (error) {
    Base.errorResponse({
      response,
      message: "MarkOrderDeliveredController code",
      error,
    });
  }
});

module.exports = router;
