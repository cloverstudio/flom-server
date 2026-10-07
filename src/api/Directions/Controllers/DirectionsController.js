"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { LocationIQ } = require("#services");

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
      return Base.errorResponse({
        response,
        code: Const.responsecodeNoReCaptchaParameter,
        message: "DirectionsController, invalid startLat parameter",
      });
    }
    if ((!startLon && startLon !== 0) || startLon < -180 || startLon > 180) {
      return Base.errorResponse({
        response,
        code: Const.responsecodeNoReCaptchaParameter,
        message: "DirectionsController, invalid startLon parameter",
      });
    }
    if ((!endLat && endLat !== 0) || endLat < -90 || endLat > 90) {
      return Base.errorResponse({
        response,
        code: Const.responsecodeNoReCaptchaParameter,
        message: "DirectionsController, invalid endLat parameter",
      });
    }
    if ((!endLon && endLon !== 0) || endLon < -180 || endLon > 180) {
      return Base.errorResponse({
        response,
        code: Const.responsecodeNoReCaptchaParameter,
        message: "DirectionsController, invalid endLon parameter",
      });
    }

    const durations = { driving: "-", bicycling: "-", walking: "-" };
    const reqModes = ["driving", "walking"];
    const origin = `${Utils.roundNumber(startLat, 5)},${Utils.roundNumber(startLon, 5)}`;
    const destination = `${Utils.roundNumber(endLat, 5)},${Utils.roundNumber(endLon, 5)}`;

    for (const mode of reqModes) {
      const data = (await LocationIQ.directions({ mode, origin, destination })) || {};

      if (data?.routes?.[0]?.duration) {
        durations[mode] = formatDuration(+data.routes[0].duration);
      }

      await Utils.sleep(100);
    }

    Base.successResponse(response, Const.responsecodeSucceed, { durations });
  } catch (error) {
    Base.errorResponse({
      response,
      message: "DirectionsController",
      error,
    });
  }
});

function formatDuration(duration) {
  if (duration < 60) {
    return `1 min`;
  } else if (duration < 60 * 60) {
    const minutes = Math.floor(duration / 60);
    const seconds = Math.round(duration % 60);
    return `${seconds >= 30 ? minutes + 1 : minutes} min`;
  } else if (duration < 60 * 60 * 24) {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.round((duration % 3600) / 60);
    return `${hours} hr${minutes > 0 ? " " + minutes + " min" : ""}`;
  } else {
    const days = Math.floor(duration / 86400);
    const hours = Math.round((duration % 86400) / 3600);
    return `${days} days${hours > 0 ? " " + hours + " hr" : ""}`;
  }
}

module.exports = router;
