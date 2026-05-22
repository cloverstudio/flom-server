"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { redis } = require("#infra");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { AccessRecord, CountryWideBan } = require("#models");
const lookup = require("geoip-lite").lookup;

/**
      * @api {get} /api/v2/qrcode/create create new qrcode string
      * @apiName Get Dictionary
      * @apiGroup WebAPI
      * 
      * @queryParam timeout - number - how long code is valid in seconds
      * @queryParam otherDevice - bool (1 or 0)
      * 
      * @apiDescription get yq code unique string
      * @apiSuccessExample Success-Response:
        {
          code: 1,
          created: 443254254,
          data: {
            code: 1233454
          }
        }
 **/

router.get("/", async function (request, response) {
  try {
    const IP = request.headers["x-forwarded-for"] || request.connection.remoteAddress;
    const uuid = request.headers["UUID"] || request.headers["uuid"];
    const timeout = request.query.timeout ? +request.query.timeout * 1000 : null;
    const otherDevice = request.query.otherDevice ? +request.query.otherDevice : null;
    const deviceType = request.headers["device-type"];

    const userCountryCode = lookup(IP)?.country;

    await AccessRecord.create({
      timestamp: new Date().toISOString(),
      countryCode: userCountryCode,
      IP,
      UUID: uuid,
      loginType: "ussd",
    });

    const code = Utils.generateRandomNumber(8).toString();

    await redis.set(
      Const.redisKeyQrCode + code,
      {
        code,
        uuid,
        otherDevice,
        deviceType,
      },
      120,
    );

    Base.successResponse(response, Const.responsecodeSucceed, { code });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "CreateQrCodeStringController",
      error,
    });
  }
});

module.exports = router;
