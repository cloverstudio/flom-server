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

    /*
      await detectFlooding();

      const countryBan = await CountryWideBan
        .findOne({
          countryCode: userCountryCode,
          created: { $gt: Date.now() - Const.millisecondsPerDay },
        })
        .lean();

      if (countryBan && countryBan.countryCode === userCountryCode) {
        const diff = Date.now() - countryBan.updated;
        const banDurationInMilliseconds =
          Utils.getCountryBanDuration(countryBan.occurences) * 60 * 1000;

        if (diff < banDurationInMilliseconds) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeCountryTemporarilyBanned,
            type: Const.logTypeLogin,
            message: `CreateQrCodeStringController, ${userCountryCode} - country temporarily banned`,
          });
        }
      }
        */

    const code = Utils.generateRandomNumber(8).toString();

    await redis.set(Const.redisKeyQrCode + code, {
      code,
      uuid,
      otherDevice,
      deviceType,
    });

    setTimeout(async () => {
      await redis.del(Const.redisKeyQrCode + code);
    }, timeout || Config.expireTimeForQRCode);

    Base.successResponse(response, Const.responsecodeSucceed, { code });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "CreateQrCodeStringController",
      error,
    });
  }
});

async function detectFlooding() {
  const records = await AccessRecord.find({
    created: { $gt: Date.now() - Const.floodPeriod },
  });

  if (records.length < Const.floodLimit) return false;

  const countryObj = {};

  for (const record of records) {
    if (!countryObj[record.countryCode]) countryObj[record.countryCode] = 0;
    countryObj[record.countryCode]++;
  }

  let max = 0,
    maxCountry;
  for (const country in countryObj) {
    if (countryObj[country] > max) {
      max = countryObj[country];
      maxCountry = country;
    }
  }

  if (max > records.length / 2) {
    const countryBan = await CountryWideBan.findOne({ countryCode: maxCountry }).lean();

    let updateObj = {};

    if (countryBan && countryBan.created > Date.now() - Const.millisecondsPerDay) {
      if (countryBan.updated) {
        const diff = Date.now() - countryBan.updated;
        const banDurationInMilliseconds =
          Utils.getCountryBanDuration(countryBan.occurences) * 60 * 1000;

        if (diff > banDurationInMilliseconds) {
          updateObj = {
            $set: { countryCode: maxCountry, updated: Date.now() },
            $inc: { occurences: 1 },
          };
        }
      }
    } else {
      updateObj = {
        $set: { countryCode: maxCountry, updated: Date.now(), created: Date.now(), occurences: 1 },
      };
    }

    if (Object.keys(updateObj).length > 0) {
      await CountryWideBan.updateOne({ countryCode: maxCountry }, updateObj, {
        upsert: true,
        setDefaultsOnInsert: true,
      });

      Utils.sendEmailWithSG(
        "Flom: Flood detection",
        `Flood detected at ${Date()} on environment: ${Config.environment}`,
        "petarb.flom@gmail.com",
      );
      Utils.sendEmailWithSG(
        "Flom: Flood detection",
        `Flood detected at ${Date()} on environment: ${Config.environment}`,
        "sinisa.brcina@pontistechnology.com",
      );
    }
  }

  return true;
}

module.exports = router;
