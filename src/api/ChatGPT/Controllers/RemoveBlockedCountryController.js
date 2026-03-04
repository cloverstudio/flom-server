"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, countries } = require("#config");
const { auth } = require("#middleware");
const { BlockedChatGPTCountry } = require("#models");

/**
 * @api {delete} /api/v2/chat-gpt/remove-blocked Unblock country
 * @apiVersion 0.0.1
 * @apiName  Unblock country
 * @apiGroup WebAPI ChatGPT
 * @apiDescription  API which is called to unblock country for ChatGPT communication.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1680870405535,
 *     "data": {
 *         "blockedCountriesList": [
 *             {
 *                 "_id": "64300bb348bcd35f0f43c7e9",
 *                 "countryCode": "AE",
 *                 "__v": 0
 *             },
 *             {
 *                 "_id": "64300bc048bcd35f0f43c7ea",
 *                 "countryCode": "AF",
 *                 "__v": 0
 *             }
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

router.delete(
  "/:countryCode",
  auth({
    allowAdmin: true,
    role: Const.Role.ADMIN,
  }),
  async (request, response) => {
    try {
      const countryCode = request.params.countryCode;

      if (countryCode === undefined) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeNoCountryCodeParameter,
          message: `RemoveBlockedCountryController - no countryCode parameter`,
        });
      }

      if (!countries[countryCode]) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidCountryCode,
          message: `RemoveBlockedCountryController - invalid countryCode parameter`,
        });
      }

      await BlockedChatGPTCountry.deleteOne({
        countryCode,
      });

      const allBlockedCountries = await BlockedChatGPTCountry.find({}).lean();

      Base.successResponse(response, Const.responsecodeSucceed, {
        blockedCountriesList: allBlockedCountries,
      });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "RemoveBlockedCountryController",
        error,
      });
    }
  },
);

module.exports = router;
