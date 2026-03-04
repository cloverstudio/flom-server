"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { Configuration } = require("#models");

/**
 * @api {get} /api/v2/sats/blocked Sats blocked countries list
 * @apiVersion 0.0.1
 * @apiName  Sats blocked countries list
 * @apiGroup WebAPI Sats
 * @apiDescription  API which is called to get list of countries in which payments with Sats are not allowd.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
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
 * @apiError (Errors) 4000007 Token invalid
 */

router.get(
  "/",
  auth({
    allowAdmin: true,
    role: Const.Role.ADMIN,
  }),
  async (request, response) => {
    try {
      const allBlockedCountries = await Configuration.findOne({
        name: "satsBannedCountries",
      }).lean();

      Base.successResponse(response, Const.responsecodeSucceed, {
        blockedCountriesList: allBlockedCountries.valueArray,
      });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "GetBlockedCountriesController",
        error,
      });
    }
  },
);

module.exports = router;
