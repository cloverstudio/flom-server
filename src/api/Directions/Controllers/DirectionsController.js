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

    const durations = { driving: "-", bicycling: "-", walking: "-" };
    const reqModes = ["driving", "walking"];
    const origin = `${Utils.roundNumber(startLat, 5)},${Utils.roundNumber(startLon, 5)}`;
    const destination = `${Utils.roundNumber(endLat, 5)},${Utils.roundNumber(endLon, 5)}`;

    try {
      for (const mode of reqModes) {
        // https://us1.locationiq.com/v1/directions/walking/16.431191277275307,43.515762721856305;16.458801102615958,43.50384642817355?key=pk.f4c8e61030a5c67c3eb241babd751833&overview=false

        const apiRequest = {
          method: "GET",
          url: Config.locationIqUrl + "/v1/directions/" + mode + "/" + origin + ";" + destination,
          query: {
            key: Config.locationIqKey,
            overview: "false",
          },
        };

        const res = await Utils.sendRequest(apiRequest);
        const data = res;

        if (data?.routes[0]?.duration) {
          durations[mode] = formatDuration(+data.routes[0].duration);
        }

        await Utils.sleep(100);
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

function formatDuration(duration) {
  if (duration < 60) {
    return `${Math.round(duration)} seconds`;
  } else if (duration < 3600) {
    const minutes = Math.floor(duration / 60);
    const seconds = Math.round(duration % 60);
    return `${minutes} minutes${seconds > 0 ? " " + seconds + " seconds" : ""}`;
  } else if (duration < 86400) {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.round((duration % 3600) / 60);
    return `${hours} hours${minutes > 0 ? " " + minutes + " minutes" : ""}`;
  } else {
    const days = Math.floor(duration / 86400);
    const hours = Math.round((duration % 86400) / 3600);
    return `${days} days${hours > 0 ? " " + hours + " hours" : ""}`;
  }
}

/*
{
    "code": "Ok",
    "routes": [
        {
            "legs": [
                {
                    "steps": [],
                    "weight": 2255.4,
                    "summary": "",
                    "duration": 2255.4,
                    "distance": 3123.8
                }
            ],
            "weight_name": "duration",
            "weight": 2255.4,
            "duration": 2255.4,
            "distance": 3123.8
        }
    ],
    "waypoints": [
        {
            "hint": "_bOvhAC0r4R-AAAAMQEAAAAAAAAAAAAAFy2MQcceKUIAAAAAAAAAAH4AAAAxAQAAAAAAAAAAAABCAAAAaLj6ACn_lwJXuPoAc_-XAgAADwX5lZZZ",
            "location": [
                16.431208,
                43.515689
            ],
            "name": "",
            "distance": 8.335696344
        },
        {
            "hint": "HyBRkCMgUZAyAAAAoAAAADcAAACOAAAAjpniQCyWsEGE__JAvgWeQTIAAACgAAAANwAAAI4AAABCAAAAxCP7AE7QlwIxJPsA5tCXAgIAXwf5lZZZ",
            "location": [
                16.458692,
                43.503694
            ],
            "name": "Spinčićeva ulica",
            "distance": 19.04843064
        }
    ]
}
*/

module.exports = router;
