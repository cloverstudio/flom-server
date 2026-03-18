"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, Config } = require("#config");
const fsp = require("fs/promises");

/**
 * @api {get} /api/v2/carriers/logo/:carrierName Get carrier logo
 * @apiVersion 2.0.3
 * @apiName Get carrier logo
 * @apiGroup WebAPI Carrier
 * @apiDescription Returns logo of the carrier. If carrier is not found returns icon of the default carrier.
 *
 * @apiHeader {String} UUID UUID of the device.
 */

router.get("/:carrierName", async function (request, response) {
  try {
    const { carrierName } = request.params;
    const filePath = Config.carrierLogoPath + "/" + carrierName + ".png";

    try {
      await fsp.access(filePath, fsp.constants.R_OK);
      return response.sendFile(filePath);
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }

    try {
      const defaultCarrierName = carrierName.slice(0, -3).toLowerCase();
      const defaultCarrierFilePath = Config.carrierLogoPath + "/" + defaultCarrierName + ".png";

      await fsp.access(defaultCarrierFilePath, fsp.constants.R_OK);
      return response.sendFile(defaultCarrierFilePath);
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
      logger.warn(`CarrierLogoController - Default logo for ${carrierName}.png not found...`);
      return response.sendStatus(404);
    }
  } catch (error) {
    return Base.errorResponse(response, Const.httpCodeServerError, "CarrierLogoController", error);
  }
});

module.exports = router;
