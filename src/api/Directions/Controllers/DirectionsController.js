"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");

/**
 * @api {get} /api/v2/directions/durations Get distance durations
 * @apiVersion 2.0.10
 * @apiName Get distance durations
 * @apiGroup WebAPI Directions
 * @apiDescription API for getting duration of travel between two locations. API calculates the duration for driving, walking and using a bicycle.
 * ALL query parameters are required! Latitude and longitude are rounded to 5 decimal places.
 *
 * @apiParam (Query string) startLat Start location latitude (between -90 and 90)
 * @apiParam (Query string) startLon Start location longitude (between -180 and 180)
 * @apiParam (Query string) endLat End location latitude (between -90 and 90)
 * @apiParam (Query string) endLon End location longitude (between -180 and 180)
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1639488046666,
 *   "data": {
 *     "durations": {
 *       "driving": "4 days 22 hours",
 *       "bicycling": "-",
 *       "walking": "58 days 4 hours"
 *     }
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 443450 Invalid startLat
 * @apiError (Errors) 443451 Invalid startLon
 * @apiError (Errors) 443452 Invalid endLat
 * @apiError (Errors) 443453 Invalid endLon
 * @apiError (Errors) 4000007 Token not valid
 */

router.get("/durations", auth({ allowUser: true }), async (request, response) => {
  try {
    const startLat = +request.query.startLat;
    const startLon = +request.query.startLon;
    const endLat = +request.query.endLat;
    const endLon = +request.query.endLon;

    if ((!startLat && startLat !== 0) || startLat < -90 || startLat > 90) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoReCaptchaParameter,
        message: "DirectionsController, invalid startLat parameter",
      });
    }
    if ((!startLon && startLon !== 0) || startLon < -180 || startLon > 180) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoReCaptchaParameter,
        message: "DirectionsController, invalid startLon parameter",
      });
    }
    if ((!endLat && endLat !== 0) || endLat < -90 || endLat > 90) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoReCaptchaParameter,
        message: "DirectionsController, invalid endLat parameter",
      });
    }
    if ((!endLon && endLon !== 0) || endLon < -180 || endLon > 180) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoReCaptchaParameter,
        message: "DirectionsController, invalid endLon parameter",
      });
    }

    const origin = `${Utils.roundNumber(startLat, 5)},${Utils.roundNumber(startLon, 5)}`;
    const destination = `${Utils.roundNumber(endLat, 5)},${Utils.roundNumber(endLon, 5)}`;
    const baseUrl =
      Config.directionsBaseUrl +
      `?key=${Config.directionsApiKey}` +
      `&origin=${origin}` +
      `&destination=${destination}`;

    const requestData = {
      method: "GET",
      url: "",
    };
    const modes = ["driving", "bicycling", "walking"];
    const durations = { driving: "-", bicycling: "-", walking: "-" };

    try {
      for (let i = 0; i < modes.length; i++) {
        const mode = modes[i];
        requestData.url = baseUrl + `&mode=${mode}`;
        console.log(requestData.url);

        const res = await Utils.sendRequest(requestData);
        console.log(res);
        const data = res;

        if (data?.routes[0]?.legs[0]?.duration.text) {
          durations[mode] = data.routes[0].legs[0].duration.text;
        }
      }
    } catch (error) {
      logger.error("DirectionsController, fetching durations", error);
    }

    Base.successResponse(response, Const.responsecodeSucceed, { durations });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "DirectionsController",
      error,
    });
  }
});

module.exports = router;
