"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { Order } = require("#models");
const { auth } = require("#middleware");
const sharp = require("sharp");
const fsp = require("fs").promises;

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
 * @apiParam (Form data) {String} [trackingNumber]    Tracking number for the shipment
 * @apiParam (Form data) {File}   [file1]             Shipping proof file (only if tracking number not provided). If multiple files, name them as file1, file2, etc. Allowed formats: all images and .pdf.
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
 * @apiError (Errors) 443942 Missing shipping info: shipping provider and either tracking number or shipping proof file must be provided
 * @apiError (Errors) 443858 User not allowed to ship the order
 * @apiError (Errors) 4000007 Token invalid
 */

router.patch("/:orderId", auth({ allowUser: true }), async function (request, response) {
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
    if (!trackingNumber && (!files || !files.file1)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidShippingInfo,
        message: "ShipOrderController, missing tracking number or shipping proof file",
      });
    }

    const { err, msg, formattedFiles } = await handleFiles(files);

    if (err) {
      return Base.newErrorResponse({
        response,
        code: err,
        message: "ShipOrderController, " + msg,
      });
    }

    const shippingInfo = {
      provider: shippingProvider,
      trackingNumber,
      files: formattedFiles,
    };

    const updatedOrder = await Order.findByIdAndUpdate(
      order._id,
      {
        $set: {
          status: Const.orderStatus.SHIPPED,
          shipping: shippingInfo,
          modified: Date.now(),
        },
        $push: {
          events: {
            event: Const.orderEvent.ORDER_SHIPPED,
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

    const { type, name, path, size } = file;

    const newName = Utils.getRandomString(32, "alpha");
    formatted.nameOnServer = newName + path.extname(name);
    formatted.mimeType = type;
    formatted.originalName = name;
    formatted.size = size;

    if (type.includes("image")) {
      const dimensions = await sharp(path).metadata();
      const { width, height } = dimensions;
      formatted.width = width;
      formatted.height = height;

      const thumbnailName = newName + "_thumb" + path.extname(name);
      await sharp(path)
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

    await fsp.copyFile(path, Config.uploadPath + formatted.nameOnServer);
    await fsp.unlink(path);

    formattedFiles.push(formatted);
  }

  return { err: null, msg: null, formattedFiles };
}

module.exports = router;
