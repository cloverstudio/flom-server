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
 *         "zip": "",
 *         "city": "New York",
 *         "street": "Fifth Avenue",
 *         "houseNumber": "666",
 *         "state": "New York",
 *         "stateCode": "NY"
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
      url: Config.locationIqUrl + "/v1/autocomplete",
      query: {
        key: Config.locationIqKey,
        q: address,
        countrycodes: countryCode.toLowerCase(),
        limit: 10,
        dedupe: 1,
        normalizeaddress: 1,
        format: "json",
        layers: "address,street",
      },
      headers: {
        Accept: "application/json",
      },
    };

    let data = [];
    const { err, data: d } = await Utils.sendRequest(apiRequest);

    if (err) {
      logger.error("AddressController error: " + err);
      return Base.successResponse(response, Const.responsecodeSucceed, { suggestions: [] });
    }

    data = d;

    const suggestions = data.map((d) => {
      const a = d.address;
      let text = "";
      if (a.house_number) {
        text += a.house_number + " ";
      }
      if (a.road) {
        text += a.road + " ";
      } else {
        text += a.name + " ";
      }
      if (a.neighbourhood) {
        text += a.neighbourhood + " ";
      }
      if (a.city) {
        text += a.city + " ";
      }

      return {
        address: text.trim(),
        zip: a.postcode || "",
        city: a.city || "",
        street: a.road || a.name || "",
        houseNumber: a.house_number || "",
        state: a.state || "",
        stateCode: Const.UsStateCodes[a.state] || "",
      };
    });

    Base.successResponse(response, Const.responsecodeSucceed, { suggestions });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "AddressController",
      error,
    });
  }
});

/*
[
    {
        "place_id": "322410501966",
        "osm_id": "3761799952",
        "osm_type": "node",
        "licence": "https://locationiq.com/attribution",
        "lat": "43.5155981",
        "lon": "16.4312198",
        "boundingbox": [
            "43.5155481",
            "43.5156481",
            "16.4311698",
            "16.4312698"
        ],
        "class": "place",
        "type": "house",
        "display_name": "14, Jobova, Poljud, Split, Split-Dalmatia County, 21000, Croatia",
        "display_place": "Jobova",
        "display_address": "14, Poljud, Split, Split-Dalmatia County, 21000, Croatia",
        "address": {
            "name": "Jobova",
            "house_number": "14",
            "road": "Jobova",
            "neighbourhood": "Poljud",
            "city": "Split",
            "county": "Split-Dalmatia County",
            "postcode": "21000",
            "country": "Croatia",
            "country_code": "hr"
        }
    }
]
*/

module.exports = router;
