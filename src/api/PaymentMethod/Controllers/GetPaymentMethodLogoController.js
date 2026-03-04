"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Config } = require("#config");
const path = require("path");
const fsp = require("fs/promises");

/**
 * @api {get} /api/v2/payment-methods/get-logo/:logoFileName Get payment method logo
 * @apiVersion 2.0.3
 * @apiName Get payment method logo
 * @apiGroup WebAPI Payment method
 * @apiDescription Returns logo of the payment method.
 *
 * @apiHeader {String} UUID UUID of the device.
 *
 **/

router.get("/:logoFileName", async function (request, response) {
  try {
    const { logoFileName } = request.params;
    const filePath = path.join(Config.paymentMethodLogoPath, logoFileName);
    const defaultPath = path.join(Config.paymentMethodLogoPath, "payment-1.png");

    try {
      await fsp.access(filePath);
      return response.sendFile(filePath);
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }

    try {
      await fsp.access(defaultPath);
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
      message: "GetPaymentMethodLogoController",
      error,
    });
  }
});

module.exports = router;
