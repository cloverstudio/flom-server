"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { Order } = require("#models");
const { auth } = require("#middleware");
const sharp = require("sharp");
const fsp = require("fs").promises;
const path = require("path");

/**
 * @api {patch} /api/v2/orders/:orderId/ship Ship order flom_v1
 * @apiVersion 2.0.34
 * @apiName  Ship order flom_v1
 * @apiGroup WebAPI Order
 * @apiDescription  Ship order by order ID.
 *
 * @apiHeader {String} access-token Users unique access token
 *
 * @apiParam (Form data) {String} shippingProvider    Shipping provider for the shipment
 * @apiParam (Form data) {String} [trackingNumber]    Tracking number for the shipment (only if shipping proof files not provided)
 * @apiParam (Form data) {File}   [file1]             Shipping proof files (only if tracking number not provided). If multiple files, name them as file1, file2, etc. Allowed formats: all images and .pdf.
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
 * @apiError (Errors) 443941 Invalid order status: order must be in payment_completed status to be shipped
 * @apiError (Errors) 443942 Missing shipping info: shipping provider and either tracking number or shipping proof file must be provided
 * @apiError (Errors) 443943 Invalid shipping proof file: only images and pdfs are allowed
 * @apiError (Errors) 443858 User not allowed to ship the order
 * @apiError (Errors) 4000007 Token invalid
 */

router.patch("/:orderId/ship", auth({ allowUser: true }), async function (request, response) {
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
        message: "ShipOrderController, order not found: " + orderId,
      });
    }

    if (order.status !== Const.orderStatus.PAYMENT_COMPLETED) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidOrderStatus,
        message: "ShipOrderController, order status must be payment_completed to ship",
      });
    }

    const relation = order.sellerId === userId ? "seller" : "buyer";

    if (relation === "buyer") {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNotAllowed,
        message: "ShipOrderController, buyer cannot ship order",
      });
    }

    const { fields, files } = await Utils.formParse(request, {
      keepExtensions: true,
      uploadDir: Config.uploadPath,
    });

    const { shippingProvider, trackingNumber } = fields;
    if (!shippingProvider) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidShippingInfo,
        message: "ShipOrderController, missing shipping provider",
      });
    }
    if (!trackingNumber && (!files || Object.keys(files).length === 0)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidShippingInfo,
        message: "ShipOrderController, missing tracking number or shipping proof file",
      });
    }

    const { err, msg, formattedFiles = [] } = await handleFiles(files);

    if (err) {
      return Base.newErrorResponse({
        response,
        code: err,
        message: "ShipOrderController, " + msg,
      });
    }

    const updateObj = {
      $set: {
        status: Const.orderStatus.SHIPPED,
        "shipping.provider": shippingProvider,
        shippedAt: Date.now(),
        modified: Date.now(),
      },
      $push: {
        events: {
          status: Const.orderStatus.SHIPPED,
          user: relation,
          userId,
          timeStamp: Date.now(),
        },
      },
    };

    if (trackingNumber) updateObj.$set["shipping.trackingNumber"] = trackingNumber;
    if (formattedFiles.length > 0) updateObj.$set["shipping.files"] = formattedFiles;

    const updatedOrder = await Order.findByIdAndUpdate(order._id, updateObj, {
      new: true,
      lean: true,
    });

    const responseData = { order: updatedOrder };
    Base.successResponse(response, Const.responsecodeSucceed, responseData);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "ShipOrderController",
      error,
    });
  }
});

async function handleFiles(files) {
  if (!files) return { err: null, msg: null, formattedFiles: [] };

  const fileArray = [];

  for (const key in files) {
    const file = files[key];
    if (file) {
      if (!file.type.includes("image") && !file.type.includes("pdf")) {
        return {
          err: Const.responsecodeInvalidShippingProof,
          msg: "Invalid file type for shipping proof. Only images and pdfs are allowed.",
        };
      }

      fileArray.push(file);
    }
  }

  const formattedFiles = [];

  for (const file of fileArray) {
    const formatted = {};

    const { type, name, path: filePath, size } = file;

    const newName = Utils.getRandomString(32, "alpha");
    formatted.nameOnServer = newName + path.extname(name);
    formatted.mimeType = type;
    formatted.originalName = name;
    formatted.size = size;

    if (type.includes("image")) {
      const dimensions = await sharp(filePath).metadata();
      const { width, height } = dimensions;
      formatted.width = width;
      formatted.height = height;

      const thumbnailName = newName + "_thumb" + path.extname(name);
      await sharp(filePath)
        .resize(300, 300, { fit: "inside" })
        .toFile(Config.uploadPath + thumbnailName);
      const thumbnailDimensions = await sharp(Config.uploadPath + thumbnailName).metadata();
      formatted.thumbnail = {
        nameOnServer: thumbnailName,
        mimeType: type,
        size: thumbnailDimensions.size,
        width: thumbnailDimensions.width,
        height: thumbnailDimensions.height,
      };
    }

    await fsp.copyFile(filePath, Config.uploadPath + formatted.nameOnServer);
    await fsp.unlink(filePath);

    formattedFiles.push(formatted);
  }

  return { err: null, msg: null, formattedFiles };
}

module.exports = router;
