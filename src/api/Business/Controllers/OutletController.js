"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, businessTags, countries } = require("#config");
const { auth } = require("#middleware");
const Utils = require("#utils");
const Logics = require("#logics");
const { Business, User, Outlet, Terminal } = require("#models");

/**
 * @api {get} /api/v2/businesses/outlets/:outletId Get outlet flom_v1
 * @apiVersion 2.0.34
 * @apiName Get outlet
 * @apiGroup WebAPI Business
 * @apiDescription Get an existing outlet. If user is not allowed to view the outlet, an error will be returned.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam (URL parameter) {String}  outletId  Outlet ID
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1783345533159,
 *     "data": {
 *         "outlet": {
 *             "_id": "6a4bb17dab58c78c74906cd6",
 *             "businessId": "6a4bb17dab58c78c74906cd6",
 *             "chainId": "6a4bb17dab58c78c74906cd6",
 *             "subChainId": "6a4bb17dab58c78c74906cd6",
 *             "name": "Petrov outlet",
 *             "address": {
 *                 "country": "Croatia",
 *                 "countryCode": "HR",
 *                 "city": "Split",
 *                 "road": "Jobova",
 *                 "houseNumber": "14",
 *                 "postCode": "21000",
 *                 "displayName": "14, Jobova, Poljud, Split, Split-Dalmatia County, 21000, Croatia"
 *             },
 *             "schedule": {
 *                 "description": "Open every day except holidays",
 *                 "weekly": {
 *                     "0": {
 *                         "enabled": false,
 *                         "periods": [ { "start": 540, "end": 660 } ]
 *                     },
 *                 },
 *                 "exceptions": [
 *                    {
 *                      "date": "2026-12-25",
 *                      "enabled": false,
 *                      "periods": [],
 *                      "description": "Christmas Day"
 *                    },
 *                    {
 *                      "date": "2026-08-15",
 *                      "enabled": true,
 *                      "periods": [
 *                        { "start": 540, "end": 660 }
 *                      ],
 *                      "description": "Assumption of Mary"
 *                    }
 *                ]
 *             },
 *             "created": 1783345533103,
 *             "createdAt": "2026-07-06T13:45:33.118Z",
 *             "updatedAt": "2026-07-06T13:45:33.118Z",
 *             "terminals": [
 *               {
 *                  "_id": "6a4bb17dab58c78c74906cd6",
 *                  "businessId": "6a4bb17dab58c78c74906cd6",
 *                  "outletId": "6a4bb17dab58c78c74906cd6",
 *                  "chainId": "6a4bb17dab58c78c74906cd6",
 *                  "subChainId": "6a4bb17dab58c78c74906cd6",
 *                  "paymentAddress": "1234567890",
 *                  "isMainTerminal": false,
 *                  "isActive": false,
 *                  "created": 1783345533103,
 *                  "createdAt": "2026-07-06T13:45:33.118Z",
 *                  "updatedAt": "2026-07-06T13:45:33.118Z",
 *                  "__v": 0
 *               }
 *             ],
 *         }
 *     }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 443981 Invalid outlet id
 * @apiError (Errors) 443982 Outlet not found
 * @apiError (Errors) 443858 User is not allowed to complete the action
 * @apiError (Errors) 4000007 Token not valid
 */

router.get("/:outletId", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const { outletId } = request.params;

    if (!outletId || !Utils.isValidObjectId(outletId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidOutletId,
        message: "OutletController, get outlet - invalid outletId",
      });
    }

    const outlet = await Outlet.findById(outletId).lean();

    if (!outlet) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeOutletNotFound,
        message: "OutletController, get outlet - outlet not found",
      });
    }

    const allowed = await Logics.checkBusinessPermissions({
      userId: user._id.toString(),
      businessId: outlet.businessId,
      action: "business:view",
    });

    if (!allowed) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNotAllowed,
        message: "OutletController, get outlet - user is not allowed to get the outlet",
      });
    }

    const terminals = await Terminal.find({ outletId: outlet._id.toString() }).lean();
    outlet.terminals = terminals || [];

    Base.successResponse(response, Const.responsecodeSucceed, { outlet });
  } catch (error) {
    return Base.newErrorResponse({
      response,
      code: Const.httpCodeServerError,
      message: "OutletController, create outlet",
      error,
    });
  }
});

/**
 * @api {post} /api/v2/businesses/outlets Create outlet flom_v1
 * @apiVersion 2.0.34
 * @apiName Create outlet
 * @apiGroup WebAPI Business
 * @apiDescription Create a new outlet.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {String}     businessId              Business ID
 * @apiParam {String}     name                    Outlet name
 * @apiParam {String}     [scheduleDescription]   Outlet schedule description
 * @apiParam {Object[]}   [workingHours]          Outlet working hours, one entry per day of the week
 * @apiParam {Object[]}   [exceptions]            Outlet schedule exceptions (holidays, special hours, etc.)
 * @apiParam {Object}     [address]               Outlet address (defaults to user's address)
 * @apiParam {String}     [latitude]              Outlet latitude (defaults to user's location latitude)
 * @apiParam {String}     [longitude]             Outlet longitude (defaults to user's location longitude)
 *
 * @apiParamExample {json} Request-Example:
 *     {
 *       "businessId": "6a4bb17dab58c78c74906cd6",
 *       "name": "Sunny Side Bakery",
 *       "scheduleDescription": "Open every day except holidays",
 *       "workingHours": [
 *         {
 *           "day": 1,  // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
 *           "enabled": true,
 *           "periods": [
 *             { "start": 480, "end": 720 },   // periods are in minutes from midnight (e.g., 480 = 8:00 AM, 1200 = 8:00 PM)
 *             { "start": 780, "end": 1020 }
 *           ]
 *         },
 *         {
 *           "day": 0,
 *           "enabled": false,
 *           "periods": []
 *         }
 *       ],
 *       "exceptions": [
 *         {
 *           "date": "2026-12-25",
 *           "enabled": false,
 *           "periods": [],
 *           "description": "Christmas Day"
 *         },
 *         {
 *           "date": "2026-08-15",
 *           "enabled": true,
 *           "periods": [
 *             { "start": 540, "end": 660 }
 *           ],
 *           "description": "Assumption of Mary"
 *         }
 *       ],
 *       "address": {
 *         "country": "Croatia",
 *         "countryCode": "HR",
 *         "city": "Karlovac",
 *         "road": "Trg bana Jelačića",
 *         "houseNumber": "3",
 *         "state": "Karlovačka županija",
 *         "postCode": "47000"
 *       },
 *      "latitude": "45.4881",
 *      "longitude": "15.5475"
 *     }
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1783345533159,
 *     "data": {
 *         "outlet": {
 *             "_id": "6a4bb17dab58c78c74906cd6",
 *             "businessId": "6a4bb17dab58c78c74906cd6",
 *             "chainId": "6a4bb17dab58c78c74906cd6",
 *             "subChainId": "6a4bb17dab58c78c74906cd6",
 *             "name": "Petrov outlet",
 *             "address": {
 *                 "country": "Croatia",
 *                 "countryCode": "HR",
 *                 "city": "Split",
 *                 "road": "Jobova",
 *                 "houseNumber": "14",
 *                 "postCode": "21000",
 *                 "displayName": "14, Jobova, Poljud, Split, Split-Dalmatia County, 21000, Croatia"
 *             },
 *             "schedule": {
 *                 "description": "Open every day except holidays",
 *                 "weekly": {
 *                     "0": {
 *                         "enabled": false,
 *                         "periods": [ { "start": 540, "end": 660 } ]
 *                     },
 *                 },
 *                 "exceptions": [
 *                    {
 *                      "date": "2026-12-25",
 *                      "enabled": false,
 *                      "periods": [],
 *                      "description": "Christmas Day"
 *                    },
 *                    {
 *                      "date": "2026-08-15",
 *                      "enabled": true,
 *                      "periods": [
 *                        { "start": 540, "end": 660 }
 *                      ],
 *                      "description": "Assumption of Mary"
 *                    }
 *                ]
 *             },
 *             "created": 1783345533103,
 *             "createdAt": "2026-07-06T13:45:33.118Z",
 *             "updatedAt": "2026-07-06T13:45:33.118Z",
 *             "__v": 0
 *         }
 *     }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 443970 Invalid business id
 * @apiError (Errors) 443971 Business not found
 * @apiError (Errors) 443858 User is not allowed to complete the action
 * @apiError (Errors) 443856 Invalid outlet name
 * @apiError (Errors) 443973 Invalid outlet location
 * @apiError (Errors) 443976 Invalid outlet schedule
 * @apiError (Errors) 443977 Invalid outlet schedule exception
 * @apiError (Errors) 4000007 Token not valid
 */

router.post("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const {
      businessId,
      name,
      workingHours,
      scheduleDescription,
      exceptions,
      address,
      latitude,
      longitude,
    } = request.body;

    if (!businessId || !Utils.isValidObjectId(businessId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidBusinessId,
        message: "OutletController, create outlet - invalid businessId",
      });
    }

    const business = await Business.findById(businessId).lean();

    if (!business) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeBusinessNotFound,
        message: "OutletController, create outlet - business not found",
      });
    }

    const allowed = await Logics.checkBusinessPermissions({
      userId: user._id.toString(),
      business,
      action: "business:profile",
    });

    if (!allowed) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNotAllowed,
        message: "OutletController, create outlet - user is not allowed to create an outlet",
      });
    }

    const info = { schedule: { weekly: {} } };

    if (!name || typeof name !== "string" || name.length < 3 || name.length > 100) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidName,
        message: "OutletController, create outlet - invalid name",
      });
    }
    info.name = name;

    if (workingHours) {
      if (!Array.isArray(workingHours)) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidOutletWorkingHours,
          message: "OutletController, create outlet - workingHours must be an array",
        });
      }

      for (const item of workingHours) {
        const day = item.day;
        if (typeof day !== "number" || day < 0 || day > 6) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidOutletWorkingHours,
            message: "OutletController, create outlet - invalid workingHours day",
          });
        }

        const periods = item.periods;
        if (periods && !Array.isArray(periods)) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidOutletWorkingHours,
            message: "OutletController, create outlet - invalid workingHours periods",
          });
        }

        const enabled = item.enabled;
        if (typeof enabled !== "boolean") {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidOutletWorkingHours,
            message: "OutletController, create outlet - invalid workingHours enabled",
          });
        }

        if (!info.schedule.weekly) {
          info.schedule.weekly = {};
        }
        info.schedule.weekly[day] = { enabled, periods };
      }
    }

    if (scheduleDescription && typeof scheduleDescription === "string") {
      info.schedule.description = scheduleDescription;
    }

    if (exceptions) {
      if (!Array.isArray(exceptions)) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidOutletScheduleException,
          message: "OutletController, create outlet - exceptions must be an array",
        });
      }

      for (const exception of exceptions) {
        if (
          !exception.date ||
          typeof exception.date !== "string" ||
          !/^\d{4}-\d{2}-\d{2}$/.test(exception.date)
        ) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidOutletScheduleException,
            message: "OutletController, create outlet - invalid schedule exception date",
          });
        }
        if (typeof exception.enabled !== "boolean") {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidOutletScheduleException,
            message: "OutletController, create outlet - invalid schedule exception enabled",
          });
        }
        if (exception.periods && !Array.isArray(exception.periods)) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidOutletScheduleException,
            message: "OutletController, create outlet - invalid schedule exception periods",
          });
        }
      }

      info.schedule.exceptions = exceptions;
    }

    if (address && typeof address === "object") {
      info.address = address;
    } else {
      info.address = user.address || {};
    }

    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);

      if (isNaN(lat) || lat < -90 || lat > 90) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidLocation,
          message: "OutletController, create outlet - invalid latitude",
        });
      }

      if (isNaN(lon) || lon < -180 || lon > 180) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidLocation,
          message: "OutletController, create outlet - invalid longitude",
        });
      }

      info.location = { type: "Point", coordinates: [lon, lat] };
    } else if (user.location && user.location.coordinates) {
      info.location = user.location;
    } else {
      info.location = { type: "Point", coordinates: [0, 0] };
    }

    const outlet = await Outlet.create({
      businessId: business._id.toString(),
      chainId: business.chainId || null,
      subChainId: business.subChainId || null,
      ...info,
    });

    Base.successResponse(response, Const.responsecodeSucceed, { outlet: outlet.toObject() });
  } catch (error) {
    return Base.newErrorResponse({
      response,
      code: Const.httpCodeServerError,
      message: "OutletController, create outlet",
      error,
    });
  }
});

/**
 * @api {patch} /api/v2/businesses/outlets/:outletId  Update outlet flom_v1
 * @apiVersion 2.0.34
 * @apiName Update outlet
 * @apiGroup WebAPI Business
 * @apiDescription Update an outlet. Only owner or assistants can update the outlet details.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {String}     [name]                  Outlet name
 * @apiParam {String}     [scheduleDescription]   Outlet schedule description
 * @apiParam {Object[]}   [workingHours]          Outlet schedule array - send only the days that are updated, the rest will remain the same
 * @apiParam {Object[]}   [exceptions]            Outlet schedule exceptions array - send all exceptions, the old ones will be replaced with the new ones
 * @apiParam {Object}     [address]               Outlet address
 * @apiParam {String}     [latitude]              Outlet latitude
 * @apiParam {String}     [longitude]             Outlet longitude
 *
 * @apiParamExample {json} Request-Example:
 *     {
 *       "name": "Sunny Side Bakery",
 *       "scheduleDescription": "Open every day except holidays",
 *       "workingHours": [
 *         {
 *           "day": 1,  // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
 *           "enabled": true,
 *           "periods": [
 *             { "start": 480, "end": 720 },   // periods are in minutes from midnight (e.g., 480 = 8:00 AM, 1200 = 8:00 PM)
 *             { "start": 780, "end": 1020 }
 *           ]
 *         },
 *         {
 *           "day": 0,
 *           "enabled": false,
 *           "periods": []
 *         }
 *       ],
 *       "exceptions": [
 *         {
 *           "date": "2026-12-25",
 *           "enabled": false,
 *           "periods": [],
 *           "description": "Christmas Day"
 *         },
 *         {
 *           "date": "2026-08-15",
 *           "enabled": true,
 *           "periods": [
 *             { "start": 540, "end": 660 }
 *           ],
 *           "description": "Assumption of Mary"
 *         }
 *       ],
 *       "address": {
 *         "country": "Croatia",
 *         "countryCode": "HR",
 *         "city": "Karlovac",
 *         "road": "Trg bana Jelačića",
 *         "houseNumber": "3",
 *         "state": "Karlovačka županija",
 *         "postCode": "47000"
 *       },
 *       "latitude": "45.4881",
 *       "longitude": "15.5475"
 *     }
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1783345533159,
 *     "data": {
 *         "outlet": {
 *             "_id": "6a4bb17dab58c78c74906cd6",
 *             "name": "Petrov outlet",
 *             "address": {
 *                 "country": "Croatia",
 *                 "countryCode": "HR",
 *                 "city": "Split",
 *                 "road": "Jobova",
 *                 "houseNumber": "14",
 *                 "postCode": "21000",
 *                 "displayName": "14, Jobova, Poljud, Split, Split-Dalmatia County, 21000, Croatia"
 *             },
 *             "schedule": {
 *                 "description": "Open every day except holidays",
 *                 "weekly": {
 *                     "0": {
 *                         "enabled": false,
 *                         "periods": [ { "start": 540, "end": 660 } ]
 *                     },
 *                 },
 *                 "exceptions": [
 *                    {
 *                      "date": "2026-12-25",
 *                      "enabled": false,
 *                      "periods": [],
 *                      "description": "Christmas Day"
 *                    },
 *                    {
 *                      "date": "2026-08-15",
 *                      "enabled": true,
 *                      "periods": [
 *                        { "start": 540, "end": 660 }
 *                      ],
 *                      "description": "Assumption of Mary"
 *                    }
 *                ]
 *             },
 *             "created": 1783345533103,
 *             "createdAt": "2026-07-06T13:45:33.118Z",
 *             "updatedAt": "2026-07-06T13:45:33.118Z",
 *             "__v": 0
 *         }
 *     }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 443981 Invalid outlet id
 * @apiError (Errors) 443982 Outlet not found
 * @apiError (Errors) 443858 User is not allowed to complete the action
 * @apiError (Errors) 443856 Invalid outlet name
 * @apiError (Errors) 443973 Invalid outlet location
 * @apiError (Errors) 443976 Invalid outlet schedule
 * @apiError (Errors) 443977 Invalid outlet schedule exception
 * @apiError (Errors) 4000007 Token not valid
 */

router.patch("/:outletId", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const { outletId } = request.params;
    const { name, workingHours, scheduleDescription, exceptions, address, longitude, latitude } =
      request.body;

    if (!outletId || !Utils.isValidObjectId(outletId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidOutletId,
        message: "OutletController, update outlet - invalid outletId",
      });
    }

    const outlet = await Outlet.findById(outletId).lean();

    if (!outlet) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeOutletNotFound,
        message: "OutletController, update outlet - outlet not found",
      });
    }

    const allowed = await Logics.checkBusinessPermissions({
      userId: user._id.toString(),
      outletId,
      action: "business:profile",
    });

    if (!allowed) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNotAllowed,
        message:
          "OutletController, update outlet - user is not allowed to update the outlet profile",
      });
    }

    const updateObj = {};

    if (name) {
      if (typeof name !== "string" || name.length < 3 || name.length > 100) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidName,
          message: "OutletController, update outlet - invalid name",
        });
      }
      updateObj.name = name;
    }

    if (workingHours) {
      if (!Array.isArray(workingHours)) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidOutletWorkingHours,
          message: "OutletController, update outlet - workingHours must be an array",
        });
      }

      const weeklySchedule = outlet.schedule?.weekly || {};
      for (const item of workingHours) {
        const day = item.day;
        if (typeof day !== "number" || day < 0 || day > 6) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidOutletWorkingHours,
            message: "OutletController, update outlet - invalid workingHours day",
          });
        }

        const periods = item.periods;
        if (periods && !Array.isArray(periods)) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidOutletWorkingHours,
            message: "OutletController, update outlet - invalid workingHours periods",
          });
        }

        const enabled = item.enabled;
        if (typeof enabled !== "boolean") {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidOutletWorkingHours,
            message: "OutletController, update outlet - invalid workingHours enabled",
          });
        }

        weeklySchedule[day] = { enabled, periods };
      }
      updateObj["schedule.weekly"] = weeklySchedule;
    }

    if (scheduleDescription && typeof scheduleDescription === "string") {
      updateObj["schedule.description"] = scheduleDescription;
    }

    if (exceptions) {
      if (!Array.isArray(exceptions)) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidOutletScheduleException,
          message: "OutletController, update outlet - exceptions must be an array",
        });
      }

      for (const exception of exceptions) {
        if (
          !exception.date ||
          typeof exception.date !== "string" ||
          !/^\d{4}-\d{2}-\d{2}$/.test(exception.date)
        ) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidOutletScheduleException,
            message: "OutletController, update outlet - invalid schedule exception date",
          });
        }
        if (typeof exception.enabled !== "boolean") {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidOutletScheduleException,
            message: "OutletController, update outlet - invalid schedule exception enabled",
          });
        }
        if (exception.periods && !Array.isArray(exception.periods)) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidOutletScheduleException,
            message: "OutletController, update outlet - invalid schedule exception periods",
          });
        }
      }

      updateObj["schedule.exceptions"] = exceptions;
    }

    if (address && typeof address === "object") {
      updateObj.address = address;
    }

    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);

      if (isNaN(lat) || lat < -90 || lat > 90) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidOutletLocation,
          message: "OutletController, update outlet - invalid latitude",
        });
      }

      if (isNaN(lon) || lon < -180 || lon > 180) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidOutletLocation,
          message: "OutletController, update outlet - invalid longitude",
        });
      }

      updateObj.location = { type: "Point", coordinates: [lon, lat] };
    }

    const updatedOutlet = await Outlet.findByIdAndUpdate(outletId, updateObj, {
      new: true,
      lean: true,
    });

    Base.successResponse(response, Const.responsecodeSucceed, { outlet: updatedOutlet });
  } catch (error) {
    return Base.newErrorResponse({
      response,
      code: Const.httpCodeServerError,
      message: "OutletController, update outlet",
      error,
    });
  }
});

module.exports = router;
