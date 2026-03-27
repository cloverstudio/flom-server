"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { Order, User } = require("#models");
const { auth } = require("#middleware");
const sharp = require("sharp");
const fsp = require("fs").promises;
const path = require("path");

/**
 * @api {patch} /api/v2/orders/:orderId/ship Ship order flom_v1
 * @apiVersion 2.0.34
 * @apiName  Ship order flom_v1
 * @apiGroup WebAPI Order
 * @apiDescription  Ship order. Frontend sends form data with a field named "data" which is a stringified JSON object, and one or more files for shipping proof.
 *
 * @apiHeader {String} access-token Users unique access token
 *
 * @apiParam (Form data) {String}  data                         Stringified JSON object.
 * @apiParam (Form data) {Boolean} data.isPickup                If true, then all other shipping fields are ignored and the order is marked as shipped with personal_pickup as the shipping method.
 * @apiParam (Form data) {String}  [data.shippingProvider]      Shipping provider for the shipment ("dhl", "ups", "usps", "fedex", "chilexpress", "blue_express", "correos_de_chile", "starken", "gig_logistics", "aramex", "jumia_logistics", "other")
 * @apiParam (Form data) {String}  [data.shippingProviderName]  Shipping provider name for the shipment (only for "other" shipping provider)
 * @apiParam (Form data) {String}  [data.trackingNumber]        Tracking number for the shipment (only for non-"other" shipping providers)
 * @apiParam (Form data) {File}    [file1]                      Shipping proof files (only for "other" shipping provider). If multiple files, name them as file1, file2, etc. Allowed formats: all images and .pdf.
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
 * @apiError (Errors) 443942 Invalid shipping provider: only predefined shipping providers or 'other' are allowed
 * @apiError (Errors) 443943 Invalid shipping proof file: only images and pdfs are allowed
 * @apiError (Errors) 443947 Missing shipping provider name for 'other' shipping provider
 * @apiError (Errors) 443948 Missing tracking number for non-'other' shipping provider
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
      $or: [{ "seller._id": userId }, { "buyer._id": userId }],
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

    const relation = order.seller._id.toString() === userId ? "seller" : "buyer";

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

    let data = {};
    try {
      data = JSON.parse(fields.data);
    } catch (error) {
      logger.error("ShipOrderController, error parsing data field: ", error);
      data = {};
    }

    let isPickup = typeof data.isPickup === "boolean" ? data.isPickup : false;
    if (isPickup) {
      const updateObj = {
        $set: {
          status: Const.orderStatus.SHIPPED,
          "shipping.provider": "personal_pickup",
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

      const updatedOrder = await Order.findByIdAndUpdate(order._id, updateObj, {
        new: true,
        lean: true,
      });

      const responseData = { order: updatedOrder };
      return Base.successResponse(response, Const.responsecodeSucceed, responseData);
    }

    const { shippingProvider, shippingProviderName = null, trackingNumber } = data;

    if (!shippingProvider) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidShippingProvider,
        message: "ShipOrderController, missing shipping provider",
      });
    }

    const providerExists = Const.shippingProviders.find(
      (provider) => provider.type === shippingProvider,
    );
    if (!providerExists) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidShippingProvider,
        message: "ShipOrderController, invalid shipping provider: " + shippingProvider,
      });
    }

    if (shippingProvider === "other" && !shippingProviderName) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeMissingShippingProviderName,
        message:
          "ShipOrderController, missing shipping provider name for 'other' shipping provider",
      });
    }
    if (
      shippingProvider === "other" &&
      !trackingNumber &&
      (!files || Object.keys(files).length === 0)
    ) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidShippingProof,
        message: "ShipOrderController, missing shipping proof file",
      });
    }
    if (shippingProvider !== "other" && !trackingNumber) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidTrackingNumber,
        message: "ShipOrderController, missing tracking number",
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

    if (shippingProvider === "other") {
      updateObj.$set["shipping.providerName"] = shippingProviderName;
    } else {
      updateObj.$set["shipping.providerName"] = providerExists.displayName;
    }
    if (trackingNumber) updateObj.$set["shipping.trackingNumber"] = trackingNumber;
    if (formattedFiles.length > 0) updateObj.$set["shipping.files"] = formattedFiles;

    const updatedOrder = await Order.findByIdAndUpdate(order._id, updateObj, {
      new: true,
      lean: true,
    });

    const buyer = await User.findById(order.buyer._id).lean();

    if (buyer.email) {
      Utils.sendEmailFromTemplate({
        to: buyer.email,
        subject: "Your order has been shipped!",
        text: `Good news! Your order "${order._id.toString()}" has been shipped.\nVisit your order page for more details.`,
        templatePath: "src/email-templates/default.html",
      });
    }

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
        .toFile(Config.uploadPath + "/" + thumbnailName);
      const thumbnailDimensions = await sharp(Config.uploadPath + "/" + thumbnailName).metadata();
      formatted.thumbnail = {
        nameOnServer: thumbnailName,
        mimeType: type,
        size: thumbnailDimensions.size,
        width: thumbnailDimensions.width,
        height: thumbnailDimensions.height,
      };
    }

    await fsp.copyFile(filePath, Config.uploadPath + "/" + formatted.nameOnServer);
    await fsp.unlink(filePath);

    formattedFiles.push(formatted);
  }

  return { err: null, msg: null, formattedFiles };
}

module.exports = router;
