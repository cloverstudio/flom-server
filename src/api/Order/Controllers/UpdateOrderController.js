"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { Order, Transfer } = require("#models");
const { auth } = require("#middleware");
const { authorizeNet } = require("#services");
const { voidOrRefundTransfer } = require("../helpers");

const actions = ["ship", "cancel", "confirm_delivery", "complete"];
const sellerActions = ["ship"];
const buyerActions = ["confirm_delivery", "cancel"];
const adminActions = ["cancel", "complete"];

/**
 * @api {patch} /api/v2/orders/:orderId Update order flom_v1
 * @apiVersion 2.0.34
 * @apiName  Update order flom_v1
 * @apiGroup WebAPI Order
 * @apiDescription  Update order details by order ID. If action is "ship", tracking number (or proof file) and shipping provider must be provided. If action is "cancel", reason for cancellation must be provided. Only buyer or seller can update the order. Buyer can only use "confirm_delivery" action while seller can use "ship" or "cancel" actions. Canceling an order will automatically refund the buyer if payment was completed. Canceling is not allowed after order is marked as shipped, unless by admin. Seller actions: ship. Buyer actions: confirm_delivery, cancel. Admin actions: cancel, complete (same as confirm_delivery, but only for admins).
 *
 * @apiHeader {String} access-token Users unique access token
 *
 * @apiParam (Form data) {File}      [proof]                     Proof of shipping (only if action is ship and tracking number not available)
 * @apiParam (Form data) {Object}    data                        Stringified object containing order details to be updated
 * @apiParam (Form data) {String}    [data.action]               Allowed values are: "ship", "cancel", "confirm_delivery", "complete" - "ship" not yet implemented!
 * @apiParam (Form data) {String}    [data.cancellationReason]   Reason for cancellation (only if action is cancel)
 * @apiParam (Form data) {String}    [data.supportTicketId]      ID of support ticket (only if action is cancel)
 * @apiParam (Form data) {String}    [data.shippingProvider]     Shipping provider for the shipment (only if action is ship)
 * @apiParam (Form data) {String}    [data.trackingNumber]       Tracking number for the shipment (only if action is ship and proof of shipping not available)
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
 * @apiError (Errors) 4000007 Token invalid
 */

router.patch(
  "/:orderId",
  auth({ allowUser: true, allowAdmin: true, role: Const.Role.ADMIN }),
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
          message: "UpdateOrderController, order not found: " + orderId,
        });
      }

      const relation = isAdmin ? "admin" : order.sellerId === userId ? "seller" : "buyer";

      const { fields, files } = await Utils.formParse(request, {
        keepExtensions: true,
        uploadDir: Config.uploadPath,
      });

      const { action, cancellationReason, supportTicketId, shippingProvider, trackingNumber } =
        fields.data ? {} : JSON.parse(fields.data);

      if (!action || !actions.includes(action)) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidAction,
          message: "UpdateOrderController, invalid or missing action",
        });
      }

      let fn = null;
      switch (action) {
        case "ship":
          //fn = shipOrder;
          return Base.successResponse(response, Const.responsecodeSucceed, {}); // Shipping not yet implemented, return success for now
          break;
        case "cancel":
          fn = cancelOrder;
          break;
        case "confirm_delivery":
          fn = confirmDelivery;
          break;
        case "complete":
          fn = confirmDelivery;
          break;
      }

      const {
        err = null,
        errMsg,
        updatedOrder,
      } = await fn({
        order,
        userId,
        relation,
        cancellationReason,
        supportTicketId,
        shippingProvider,
        trackingNumber,
        files,
      });

      if (err) {
        return Base.newErrorResponse({
          response,
          code: err,
          message: "UpdateOrderController, " + errMsg,
        });
      }

      //const responseData = { updatedOrder };
      Base.successResponse(response, Const.responsecodeSucceed, {});
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "UpdateOrderController",
        error,
      });
    }
  },
);

async function confirmDelivery({ order, userId, relation }) {
  if (relation === "seller") {
    return { err: Const.responsecodeUserNotAllowed, errMsg: "Seller cannot confirm delivery" };
  }

  const updatedOrder = await Order.findByIdAndUpdate(
    order._id,
    {
      $set: { status: Const.orderStatus.COMPLETED },
      $push: {
        events: {
          status: Const.orderStatus.COMPLETED,
          user: relation,
          userId,
          timeStamp: Date.now(),
        },
      },
    },
    { new: true, lean: true },
  );

  return { updatedOrder };
}

async function cancelOrder({ order, userId, relation, cancellationReason, supportTicketId }) {
  if (relation === "seller") {
    return { err: Const.responsecodeUserNotAllowed, errMsg: "Seller cannot cancel order" };
  }
  if (
    [Const.orderStatus.SHIPPED, Const.orderStatus.COMPLETED, Const.orderStatus.CANCELED].includes(
      order.status,
    )
  ) {
    return {
      err: Const.responsecodeInvalidOrderStatus,
      errMsg: "Cannot cancel order after it is marked as shipped/completed/canceled/refunded",
    };
  }

  const transfer = await Transfer.findById(order.transferId).lean();

  if (!transfer) {
    logger.error(
      `Transfer with ID ${order.transferId} not found for order ${order._id.toString()}.`,
    );
    return false;
  }

  const transactionDetails = await authorizeNet.getTransactionDetails(transfer);

  if (!transactionDetails) {
    logger.error(`Failed to retrieve transaction details for transfer ${transfer._id.toString()}.`);
    return false;
  }

  logger.debug(`Transaction details for transfer ${transfer._id.toString()}:`, transactionDetails);

  let action = null;
  if (transactionDetails.transactionStatus === "settledSuccessfully") {
    action = "refund";
  } else if (
    transactionDetails.transactionStatus === "authorizedPendingCapture" ||
    transactionDetails.transactionStatus === "capturedPendingSettlement"
  ) {
    action = "void";
  } else {
    logger.error(
      `Transfer ${transfer._id.toString()} has transaction status ${
        transactionDetails.transactionStatus
      } which is not eligible for voiding or refunding.`,
    );
    return false;
  }

  await voidOrRefundTransfer({ transfer, action });

  const updatedOrder = await Order.findByIdAndUpdate(
    order._id,
    {
      $set: { status: Const.orderStatus.CANCELED, cancellationReason, supportTicketId },
      $push: {
        events: {
          status: Const.orderStatus.CANCELED,
          user: relation,
          userId,
          timeStamp: Date.now(),
        },
      },
    },
    { new: true, lean: true },
  );

  await Transfer.findByIdAndUpdate(order.transferId, {
    $set: {
      status: action === "refund" ? Const.transferRefundComplete : Const.transferVoided,
    },
  });

  return { updatedOrder };
}

module.exports = router;
