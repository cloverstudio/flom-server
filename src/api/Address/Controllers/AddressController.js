"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, Config } = require("#config");
const { logger } = require("#infra");
const Utils = require("#utils");
const { auth } = require("#middleware");

/**
 * @api {get} /api/v2/address/autocomplete Address autocomplete
 * @apiVersion 2.0.6
 * @apiName Address autocomplete
 * @apiGroup WebAPI Address
 * @apiDescription Returns list of autocomplete suggestions for the given incomplete address
 *
 * @apiHeader {String} UUID UUID of the device
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiParam (Query string) {String} address First 4 letters of the address to autocomplete. If length is less than 4 API returns empty suggestions array.
 * @apiParam (Query string) {String} countryCode Country code for the address (e.g. "US")
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1616506256964,
 *   "version": {
 *     "update": 1, // 0 - no update, 1 - optional update
 *     "popupHiddenLength": 24 // in hours
 *   },
 *   "data": {
 *     "suggestions": [
 *       {
 *         "address": "666 Fifth Avenue",
 *         "zip": ""
 *       },
 *       {
 *         "address": "666 Fifth Street",
 *         "zip": "96134"
 *       },
 *       {
 *         "address": "666 East Fifth Avenue",
 *         "zip": "43201"
 *       },
 *       {
 *         "address": "666 East Fifth Avenue",
 *         "zip": "43130"
 *       }
 *     ]
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443060 No country code parameter
 * @apiError (Errors) 443061 Wrong country code parameter
 * @apiError (Errors) 443102 No address parameter
 * @apiError (Errors) 4000007 Token invalid
 */

router.get("/", auth({ allowUser: true }), async function (request, response) {
  try {
    let { address, countryCode } = request.query;
    if (!address) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoAddress,
        message: `AddressController, no address`,
      });
    }
    if (address.length < 4) {
      return Base.successResponse(response, Const.responsecodeSucceed, { suggestions: [] });
    }
    if (!countryCode) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNoCountryCode,
        message: `AddressController, no countryCode`,
      });
    }

    const apiRequest = {
      method: "GET",
      url: Config.addressAutocompleteApiUrl,
      query: {
        api_key: Config.addressAutocompleteApiKey,
        text: encodeURIComponent(address),
        layers: address,
      },
    };

    let data;
    try {
      data = await Utils.sendRequest(apiRequest);
    } catch (error) {
      logger.error("AddressController", error);
      return Base.successResponse(response, Const.responsecodeSucceed, {
        suggestions: [],
      });
    }

    let suggestions;
    if (Const.alternativeAddressCountries.includes(countryCode)) {
      suggestions = data.features.map((suggestion) => {
        return {
          address: `${suggestion.properties.name}, ${suggestion.properties.region}, ${suggestion.properties.country}`,
          zip: suggestion.properties.postalcode || "",
        };
      });
    } else {
      suggestions = data.features.map((suggestion) => {
        return {
          address: `${suggestion.properties.street} , ${suggestion.properties.region}, ${suggestion.properties.country}`,
          zip: suggestion.properties.postalcode || "",
        };
      });
    }

    Base.successResponse(response, Const.responsecodeSucceed, {
      suggestions: removeDuplicates(suggestions),
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "AddressController",
      error,
    });
  }
});

const removeDuplicates = (duplicates) => {
  const flag = {};
  const unique = [];
  duplicates.forEach((duplicate) => {
    if (!flag[duplicate.zip]) {
      flag[duplicate.zip] = true;
      unique.push(duplicate);
    }
  });
  return unique;
};

module.exports = router;
