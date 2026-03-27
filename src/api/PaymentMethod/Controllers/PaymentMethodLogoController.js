"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Config } = require("#config");
const path = require("path");
const fsp = require("fs/promises");

/**
 * @api {get} /api/v2/payment-methods/logo/:type Payment method logo
 * @apiVersion 2.0.3
 * @apiName Payment method logo
 * @apiGroup WebAPI Payment method
 * @apiDescription Returns logo of the payment method. If payment method is not found returns icon of the default payment method (type 1).
 *
 * @apiHeader {String} UUID UUID of the device.
 *
 **/

router.get("/:type", async function (request, response) {
  try {
    const { type } = request.params;
    const filePath = path.join(Config.paymentMethodLogoPath, "payment-" + type + ".png");
    const defaultPath = path.join(Config.paymentMethodLogoPath, "payment-1.png");

    try {
      await fsp.access(filePath, fsp.constants.R_OK);
      return response.sendFile(filePath);
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }

    try {
      await fsp.access(defaultPath, fsp.constants.R_OK);
      return response.sendFile(defaultPath);
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }

    response.sendStatus(404);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "PaymentMethodLogoController",
      error,
    });
  }
});

module.exports = router;
