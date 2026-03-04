"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { DidWWNumber, AccessRecord, CountryWideBan } = require("#models");
const lookup = require("geoip-lite").lookup;

/**
     * @api {get} /api/v2/login-attempt/phone-number/:loginAttemptId check if user exists
     * @apiName check if user exists
     * @apiGroup WebAPI
     * @apiDescription  checks if there is user with given phone number
     * @apiHeader {String} UUID or uuid UUID
     * 
     *  @apiParam {String} phoneNumber phoneNumber
     *
     * @apiSuccessExample Success-Response:
        {
          "code": 1,
          "time": 1590063167731,
          "data": {
              "freeNumber": "+19725029333"
              "reservedAt": 1590222167745
            }
        }
  **/

router.get("", async (request, response) => {
  try {
    const UUID = request.headers["UUID"] || request.headers["uuid"];
    const IP = request.headers["x-forwarded-for"] || request.connection.remoteAddress;

    const userCountryCode = lookup(IP)?.country;

    await AccessRecord.create({
      timestamp: new Date().toISOString(),
      countryCode: userCountryCode,
      IP,
      UUID,
      loginType: "didww",
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
            message: `GetFreeDidWWNumberController, ${userCountryCode} - country temporarily banned`,
          });
        }
      }
        */

    const modified = Date.now();

    let freeNumber = await DidWWNumber.findOneAndUpdate(
      { isReserved: false, countryCode: userCountryCode },
      { isReserved: true, modified },
    ).lean();

    if (!freeNumber)
      freeNumber = await DidWWNumber.findOneAndUpdate(
        { isReserved: false },
        { isReserved: true, modified },
      ).lean();

    if (freeNumber) {
      setTimeout(async () => {
        await DidWWNumber.findOneAndUpdate(
          { phoneNumber: freeNumber.phoneNumber },
          { isReserved: false, modified: Date.now() },
        );
      }, 40000);
    }

    logger.info("GetFreeDidWWNumberController, free number: " + JSON.stringify(freeNumber));

    Base.successResponse(response, Const.responsecodeSucceed, {
      freeNumber: freeNumber?.phoneNumber,
      reservedAt: freeNumber ? Math.floor(modified / 1000) : undefined,
      tempToken: freeNumber ? Utils.getRandomString() : undefined,
    });
  } catch (e) {
    return Base.errorResponse(
      response,
      Const.httpCodeServerError,
      "GetFreeDidWWNumberController",
      e,
    );
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
