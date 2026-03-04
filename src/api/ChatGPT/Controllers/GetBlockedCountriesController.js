"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { BlockedChatGPTCountry } = require("#models");

/**
 * @api {get} /api/v2/chat-gpt/blocked ChatGPT blocked countries list
 * @apiVersion 0.0.1
 * @apiName  ChatGPT blocked countries list
 * @apiGroup WebAPI ChatGPT
 * @apiDescription  API which is called to get list of countries that banned ChatGPT.
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
      const allBlockedCountries = await BlockedChatGPTCountry.find({}).lean();

      Base.successResponse(response, Const.responsecodeSucceed, {
        blockedCountriesList: allBlockedCountries,
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
