"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, countries } = require("#config");
const { auth } = require("#middleware");
const { Configuration } = require("#models");

/**
 * @api {post} /api/v2/sats/add-blocked Block country
 * @apiVersion 0.0.1
 * @apiName  Block country
 * @apiGroup WebAPI Sats
 * @apiDescription  API which is called to block country for payments with Sats. Country code should be sent in request body.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiParam {String} countryCode  Country code
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1680870405535,
 *     "data": {
 *         "blockedCountriesList": [
 *             "AE"
 *         ]
 *     }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443690 No country code parameter
 * @apiError (Errors) 443691 Invalid countryCode parameter
 * @apiError (Errors) 4000007 Token invalid
 */

router.post(
  "/",
  auth({
    allowAdmin: true,
    role: Const.Role.ADMIN,
  }),
  async (request, response) => {
    try {
      const countryCode = request.body.countryCode;

      if (countryCode === undefined) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeNoCountryCodeParameter,
          message: `AddNewBlockedCountryController - no countryCode parameter`,
        });
      }

      if (!countries[countryCode]) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidCountryCode,
          message: `AddNewBlockedCountryController - invalid countryCode parameter`,
        });
      }

      const result = await Configuration.updateOne(
        { name: "satsBannedCountries" },
        { $push: { valueArray: countryCode } },
      );

      const allBlockedCountries = await Configuration.findOne({
        name: "satsBannedCountries",
      }).lean();

      Base.successResponse(response, Const.responsecodeSucceed, {
        blockedCountriesList: allBlockedCountries.valueArray,
      });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "AddNewBlockedCountryController",
        error,
      });
    }
  },
);

module.exports = router;
