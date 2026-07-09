"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, businessTags, countries } = require("#config");
const { auth } = require("#middleware");
const Utils = require("#utils");
const { Category, Business, User } = require("#models");

/**
 * @api {get} /api/v2/businesses/:businessId  Get business flom_v1
 * @apiVersion 2.0.34
 * @apiName Get business
 * @apiGroup WebAPI Business
 * @apiDescription Get business by ID. Only owner or assistants can access the business details.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1783345670376,
 *     "data": {
 *         "business": {
 *             "_id": "6a4bb17dab58c78c74906cd6",
 *             "name": "Petrov biznis",
 *             "description": "mjesto za mene",
 *             "status": "created",
 *             "owner": {
 *                 "_id": "641d9c333478cf0d6a500547",
 *                 "phoneNumber": "+385958710207"
 *             },
 *             "address": {
 *                 "country": "Croatia",
 *                 "countryCode": "HR",
 *                 "city": "Split",
 *                 "road": "Jobova",
 *                 "houseNumber": "14",
 *                 "postCode": "21000",
 *                 "displayName": "14, Jobova, Poljud, Split, Split-Dalmatia County, 21000, Croatia"
 *             },
 *             "phoneNumber": "+385958710207",
 *             "whatsAppConnected": false,
 *             "verificationStatus": "unverified",
 *             "market": "NG",
 *             "tagIds": ["tag1", "tag2", "tag3"],
 *             "tags": [
 *                {
 *                  "id": "tag1",
 *                  "display": { "en-NG": "Makeup & Beauty" },
 *                  "enabledInMarket": true
 *                }
 *             ],
 *             "schedule": {
 *                 "weekly": {
 *                     "0": {
 *                         "periods": []
 *                     },
 *                     "1": {
 *                         "periods": []
 *                     },
 *                     "2": {
 *                         "periods": []
 *                     },
 *                     "3": {
 *                         "periods": []
 *                     },
 *                     "4": {
 *                         "periods": []
 *                     },
 *                     "5": {
 *                         "periods": []
 *                     },
 *                     "6": {
 *                         "periods": []
 *                     }
 *                 },
 *                 "exceptions": []
 *             },
 *             "assistants": [],
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
 * @apiError (Errors) 443858 User is not owner or active assistant of the business
 * @apiError (Errors) 4000007 Token not valid
 */

router.get("/:businessId", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const { businessId } = request.params;

    if (!businessId || !Utils.isValidObjectId(businessId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidBusinessId,
        message: "BusinessController, get business - invalid businessId",
      });
    }

    const business = await Business.findById(businessId).lean();

    if (!business) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeBusinessNotFound,
        message: "BusinessController, get business - business not found",
      });
    }

    if (
      business.owner._id !== user._id.toString() &&
      business.assistants.find((a) => a._id === user._id.toString())?.status !== "active"
    ) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNotAllowed,
        message:
          "BusinessController, get business - user is not owner or active assistant of the business",
      });
    }

    Base.successResponse(response, Const.responsecodeSucceed, { business });
  } catch (error) {
    return Base.newErrorResponse({
      response,
      code: Const.httpCodeServerError,
      message: "BusinessController, get business",
      error,
    });
  }
});

/**
 * @api {get} /api/v2/businesses  Get businesses flom_v1
 * @apiVersion 2.0.34
 * @apiName Get businesses
 * @apiGroup WebAPI Business
 * @apiDescription List Businesses. Returns all businesses where the user is the owner or an assistant.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1783345724687,
 *     "data": {
 *         "businesses": [
 *             {
 *                 "_id": "6a4bb17dab58c78c74906cd6",
 *                 "name": "Petrov biznis",
 *                 "description": "mjesto za mene",
 *                 "status": "created",
 *                 "owner": {
 *                     "_id": "641d9c333478cf0d6a500547",
 *                     "phoneNumber": "+385958710207"
 *                 },
 *                 "address": {
 *                     "country": "Croatia",
 *                     "countryCode": "HR",
 *                     "city": "Split",
 *                     "road": "Jobova",
 *                     "houseNumber": "14",
 *                     "postCode": "21000",
 *                     "displayName": "14, Jobova, Poljud, Split, Split-Dalmatia County, 21000, Croatia"
 *                 },
 *                 "phoneNumber": "+385958710207",
 *                 "whatsAppConnected": false,
 *                 "verificationStatus": "unverified",
 *                 "market": "NG",
 *                 "tagIds": ["tag1", "tag2", "tag3"],
 *                 "tags": [
 *                    {
 *                      "id": "tag1",
 *                      "display": { "en-NG": "Makeup & Beauty" },
 *                      "enabledInMarket": true
 *                    }
 *                 ],
 *                 "schedule": {
 *                     "weekly": {
 *                         "0": {
 *                             "periods": []
 *                         },
 *                         "1": {
 *                             "periods": []
 *                         },
 *                         "2": {
 *                             "periods": []
 *                         },
 *                         "3": {
 *                             "periods": []
 *                         },
 *                         "4": {
 *                             "periods": []
 *                         },
 *                         "5": {
 *                             "periods": []
 *                         },
 *                         "6": {
 *                             "periods": []
 *                         }
 *                     },
 *                     "exceptions": []
 *                 },
 *                 "assistants": [],
 *                 "created": 1783345533103,
 *                 "createdAt": "2026-07-06T13:45:33.118Z",
 *                 "updatedAt": "2026-07-06T13:45:33.118Z",
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
 * @apiError (Errors) 4000007 Token not valid
 */

router.get("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;

    const businesses = await Business.find({
      $or: [{ "owner._id": user._id.toString() }, { "assistants._id": user._id.toString() }],
    }).lean();

    Base.successResponse(response, Const.responsecodeSucceed, { businesses });
  } catch (error) {
    return Base.newErrorResponse({
      response,
      code: Const.httpCodeServerError,
      message: "BusinessController, list businesses",
      error,
    });
  }
});

/**
 * @api {post} /api/v2/businesses Create business flom_v1
 * @apiVersion 2.0.34
 * @apiName Create business
 * @apiGroup WebAPI Business
 * @apiDescription Create a new business.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {String}     name                    Business name
 * @apiParam {String}     description             Business description
 * @apiParam {String}     phoneNumber             Business phone number
 * @apiParam {String}     [whatsAppPhoneNumber]   Business WhatsApp phone number
 * @apiParam {String}     [scheduleDescription]   Business schedule description
 * @apiParam {Object[]}   [workingHours]          Business working hours, one entry per day of the week
 * @apiParam {Object[]}   [exceptions]            Business schedule exceptions (holidays, special hours, etc.)
 * @apiParam {Object}     [address]               Business address (defaults to user's address)
 * @apiParam {String}     [market]                Business market (country code - HR, NG, US) - defaults to owner's country code
 * @apiParam {String[]}   [tagIds]                Tag ids for the business (array of tag IDs)
 *
 * @apiParamExample {json} Request-Example:
 *     {
 *       "name": "Sunny Side Bakery",
 *       "description": "Fresh bread and pastries daily",
 *       "phoneNumber": "+385911234567",
 *       "whatsAppPhoneNumber": "+385911234567",
 *       "scheduleDescription": "Open every day except holidays",
 *       "market": "NG",
 *       "tagIds": ["tag1", "tag2", "tag3"],
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
 *           "periods": []
 *         },
 *         {
 *           "date": "2026-08-15",
 *           "enabled": true,
 *           "periods": [
 *             { "start": 540, "end": 660 }
 *           ]
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
 *       }
 *     }
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1783345533159,
 *     "data": {
 *         "business": {
 *             "name": "Petrov biznis",
 *             "description": "mjesto za mene",
 *             "status": "created",
 *             "owner": {
 *                 "_id": "641d9c333478cf0d6a500547",
 *                 "phoneNumber": "+385958710207"
 *             },
 *             "address": {
 *                 "country": "Croatia",
 *                 "countryCode": "HR",
 *                 "city": "Split",
 *                 "road": "Jobova",
 *                 "houseNumber": "14",
 *                 "postCode": "21000",
 *                 "displayName": "14, Jobova, Poljud, Split, Split-Dalmatia County, 21000, Croatia"
 *             },
 *             "phoneNumber": "+385958710207",
 *             "whatsAppConnected": false,
 *             "verificationStatus": "unverified",
 *             "market": "NG",
 *             "tagIds": ["tag1", "tag2", "tag3"],
 *             "tags": [
 *                {
 *                  "id": "tag1",
 *                  "display": { "en-NG": "Makeup & Beauty" },
 *                  "enabledInMarket": true
 *                }
 *             ],
 *             "schedule": {
 *                 "weekly": {
 *                     "0": {
 *                         "periods": []
 *                     },
 *                     "1": {
 *                         "periods": []
 *                     },
 *                     "2": {
 *                         "periods": []
 *                     },
 *                     "3": {
 *                         "periods": []
 *                     },
 *                     "4": {
 *                         "periods": []
 *                     },
 *                     "5": {
 *                         "periods": []
 *                     },
 *                     "6": {
 *                         "periods": []
 *                     }
 *                 },
 *                 "exceptions": []
 *             },
 *             "_id": "6a4bb17dab58c78c74906cd6",
 *             "assistants": [],
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
 * @apiError (Errors) 443972 Invalid business name
 * @apiError (Errors) 443973 Invalid business description
 * @apiError (Errors) 443974 Invalid business phone number
 * @apiError (Errors) 443975 Invalid business WhatsApp phone number
 * @apiError (Errors) 443976 Invalid business schedule
 * @apiError (Errors) 443977 Invalid business schedule exception
 * @apiError (Errors) 443979 Invalid business market
 * @apiError (Errors) 443980 Invalid business tag
 * @apiError (Errors) 400680 Category not found
 * @apiError (Errors) 400681 Invalid category ID
 * @apiError (Errors) 4000007 Token not valid
 */

router.post("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const {
      name,
      description,
      phoneNumber,
      whatsAppPhoneNumber,
      workingHours,
      scheduleDescription,
      exceptions,
      address,
      market,
      tagIds = [],
    } = request.body;

    const info = { schedule: { weekly: {} } };

    if (!name || typeof name !== "string" || name.length < 3 || name.length > 100) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidBusinessName,
        message: "BusinessController, create business - invalid name",
      });
    }
    info.name = name;

    if (
      !description ||
      typeof description !== "string" ||
      description.length < 3 ||
      description.length > 1000
    ) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidBusinessDescription,
        message: "BusinessController, create business - invalid description",
      });
    }
    info.description = description;

    if (
      !phoneNumber ||
      typeof phoneNumber !== "string" ||
      phoneNumber.length < 3 ||
      phoneNumber.length > 20
    ) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidBusinessPhoneNumber,
        message: "BusinessController, create business - invalid phone number",
      });
    }
    info.phoneNumber = phoneNumber;

    if (whatsAppPhoneNumber) {
      if (
        typeof whatsAppPhoneNumber !== "string" ||
        whatsAppPhoneNumber.length < 3 ||
        whatsAppPhoneNumber.length > 20
      ) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidBusinessWhatsAppPhoneNumber,
          message: "BusinessController, create business - invalid WhatsApp phone number",
        });
      }
      info.whatsAppPhoneNumber = whatsAppPhoneNumber;
    }

    if (workingHours) {
      if (!Array.isArray(workingHours)) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidBusinessWorkingHours,
          message: "BusinessController, create business - workingHours must be an array",
        });
      }

      for (const item of workingHours) {
        const day = item.day;
        if (typeof day !== "number" || day < 0 || day > 6) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidBusinessWorkingHours,
            message: "BusinessController, create business - invalid workingHours day",
          });
        }

        const periods = item.periods;
        if (periods && !Array.isArray(periods)) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidBusinessWorkingHours,
            message: "BusinessController, create business - invalid workingHours periods",
          });
        }

        const enabled = item.enabled;
        if (typeof enabled !== "boolean") {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidBusinessWorkingHours,
            message: "BusinessController, create business - invalid workingHours enabled",
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
          code: Const.responsecodeInvalidBusinessScheduleException,
          message: "BusinessController, create business - exceptions must be an array",
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
            code: Const.responsecodeInvalidBusinessScheduleException,
            message: "BusinessController, create business - invalid schedule exception date",
          });
        }
        if (typeof exception.enabled !== "boolean") {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidBusinessScheduleException,
            message: "BusinessController, create business - invalid schedule exception enabled",
          });
        }
        if (exception.periods && !Array.isArray(exception.periods)) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidBusinessScheduleException,
            message: "BusinessController, create business - invalid schedule exception periods",
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

    if (market) {
      if (!countries[market]) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidBusinessMarket,
          message: "BusinessController, create business - invalid market",
        });
      }

      info.market = market;
    } else {
      info.market = user.countryCode;
    }

    if (tagIds && !Array.isArray(tagIds)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidBusinessTag,
        message: "BusinessController, create business - tagIds must be an array",
      });
    }

    if (tagIds.length > 0) {
      const tagMap = {};

      businessTags.forEach((t) => {
        tagMap[t.id] = t;
      });

      tagIds.forEach((t) => {
        if (!tagMap[t]) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidBusinessTag,
            message: "BusinessController, create business - invalid tag ID",
          });
        }

        if (tagMap[t].regulated) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidBusinessTag,
            message: "BusinessController, create business - regulated tag ID not allowed",
          });
        }
      });

      info.tagIds = tagIds;
    }

    const business = await Business.create({
      owner: { _id: user._id.toString(), phoneNumber: user.phoneNumber },
      ...info,
    });

    await User.updateOne({ _id: user._id.toString() }, { hasBusiness: true });

    Base.successResponse(response, Const.responsecodeSucceed, { business: business.toObject() });
  } catch (error) {
    return Base.newErrorResponse({
      response,
      code: Const.httpCodeServerError,
      message: "BusinessController, create business",
      error,
    });
  }
});

/**
 * @api {patch} /api/v2/businesses/:businessId  Update business flom_v1
 * @apiVersion 2.0.34
 * @apiName Update business
 * @apiGroup WebAPI Business
 * @apiDescription Update a business. Only owner or assistants can update the business details.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {String}     [name]                  Business name
 * @apiParam {String}     [description]           Business description
 * @apiParam {String}     [phoneNumber]           Business phone number
 * @apiParam {String}     [whatsAppPhoneNumber]   Business WhatsApp phone number
 * @apiParam {Boolean}    [disableBusiness]       Whether to disable the business (only owner can disable)
 * @apiParam {Boolean}    [enableBusiness]        Whether to enable the business (only owner can enable) - previous business status is reinstated
 * @apiParam {String}     [scheduleDescription]   Business schedule description
 * @apiParam {Object[]}   [workingHours]          Business schedule array - send only the days that are updated, the rest will remain the same
 * @apiParam {Object[]}   [exceptions]            Business schedule exceptions array - send all exceptions, the old ones will be replaced with the new ones
 * @apiParam {Object}     [address]               Business address (default is user's address)
 * @apiParam {String}     [market]                Business market (country code - HR, NG, US) - defaults to owner's country code
 * @apiParam {String[]}   [tagIds]                Tag ids for the business (array of tag IDs) (send full array of tagIds, the old ones will be replaced with the new ones)
 *
 * @apiParamExample {json} Request-Example:
 *     {
 *       "name": "Sunny Side Bakery",
 *       "description": "Fresh bread and pastries daily",
 *       "phoneNumber": "+385911234567",
 *       "whatsAppPhoneNumber": "+385911234567",
 *       "scheduleDescription": "Open every day except holidays",
 *       "disableBusiness": false,
 *       "enableBusiness": true,
 *       "market": "NG",
 *       "tagIds": ["tag1", "tag2", "tag3"],
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
 *           "periods": []
 *         },
 *         {
 *           "date": "2026-08-15",
 *           "enabled": true,
 *           "periods": [
 *             { "start": 540, "end": 660 }
 *           ]
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
 *       }
 *     }
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1783345533159,
 *     "data": {
 *         "updatedBusiness": {
 *             "name": "Petrov biznis",
 *             "description": "mjesto za mene",
 *             "status": "created",
 *             "owner": {
 *                 "_id": "641d9c333478cf0d6a500547",
 *                 "phoneNumber": "+385958710207"
 *             },
 *             "address": {
 *                 "country": "Croatia",
 *                 "countryCode": "HR",
 *                 "city": "Split",
 *                 "road": "Jobova",
 *                 "houseNumber": "14",
 *                 "postCode": "21000",
 *                 "displayName": "14, Jobova, Poljud, Split, Split-Dalmatia County, 21000, Croatia"
 *             },
 *             "phoneNumber": "+385958710207",
 *             "whatsAppConnected": false,
 *             "verificationStatus": "unverified",
 *             "market": "NG",
 *             "tagIds": ["tag1", "tag2", "tag3"],
 *             "tags": [
 *                {
 *                  "id": "tag1",
 *                  "display": { "en-NG": "Makeup & Beauty" },
 *                  "enabledInMarket": true
 *                }
 *             ],
 *             "schedule": {
 *                 "weekly": {
 *                     "0": {
 *                         "periods": []
 *                     },
 *                     "1": {
 *                         "periods": []
 *                     },
 *                     "2": {
 *                         "periods": []
 *                     },
 *                     "3": {
 *                         "periods": []
 *                     },
 *                     "4": {
 *                         "periods": []
 *                     },
 *                     "5": {
 *                         "periods": []
 *                     },
 *                     "6": {
 *                         "periods": []
 *                     }
 *                 },
 *                 "exceptions": []
 *             },
 *             "_id": "6a4bb17dab58c78c74906cd6",
 *             "assistants": [],
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
 * @apiError (Errors) 443972 Invalid business name
 * @apiError (Errors) 443973 Invalid business description
 * @apiError (Errors) 443974 Invalid business phone number
 * @apiError (Errors) 443975 Invalid business WhatsApp phone number
 * @apiError (Errors) 443976 Invalid business schedule
 * @apiError (Errors) 443977 Invalid business schedule exception
 * @apiError (Errors) 443979 Invalid business market
 * @apiError (Errors) 443980 Invalid business tag
 * @apiError (Errors) 400680 Category not found
 * @apiError (Errors) 400681 Invalid category ID
 * @apiError (Errors) 4000007 Token not valid
 */

router.patch("/:businessId", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const { businessId } = request.params;
    const {
      name,
      description,
      phoneNumber,
      whatsAppPhoneNumber,
      workingHours,
      scheduleDescription,
      exceptions,
      address,
      disableBusiness,
      enableBusiness,
      market,
      tagIds = [],
    } = request.body;

    if (!businessId || !Utils.isValidObjectId(businessId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidBusinessId,
        message: "BusinessController, update business - invalid businessId",
      });
    }

    const business = await Business.findById(businessId).lean();

    if (!business) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeBusinessNotFound,
        message: "BusinessController, update business - business not found",
      });
    }

    if (
      business.owner._id !== user._id.toString() &&
      business.assistants.find((a) => a._id === user._id.toString())?.status !== "active"
    ) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNotAllowed,
        message:
          "BusinessController, update business - user is not owner or active assistant of the business",
      });
    }

    const updateObj = {};

    if (disableBusiness && disableBusiness === true) {
      if (business.owner._id !== user._id.toString()) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeUserNotAllowed,
          message: "BusinessController, update business - only owner can disable the business",
        });
      }
      updateObj.status = "disabled";
      updateObj.oldStatus = business.status || "created";
    }

    if (enableBusiness && enableBusiness === true) {
      if (business.owner._id !== user._id.toString()) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeUserNotAllowed,
          message: "BusinessController, update business - only owner can enable the business",
        });
      }
      updateObj.status = business.oldStatus || "created";
    }

    if (name) {
      if (typeof name !== "string" || name.length < 3 || name.length > 100) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidBusinessName,
          message: "BusinessController, update business - invalid name",
        });
      }
      updateObj.name = name;
    }

    if (description) {
      if (typeof description !== "string" || description.length < 3 || description.length > 1000) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidBusinessDescription,
          message: "BusinessController, update business - invalid description",
        });
      }
      updateObj.description = description;
    }

    if (phoneNumber) {
      if (typeof phoneNumber !== "string" || phoneNumber.length < 3 || phoneNumber.length > 20) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidBusinessPhoneNumber,
          message: "BusinessController, update business - invalid phone number",
        });
      }
      updateObj.phoneNumber = phoneNumber;
    }

    if (whatsAppPhoneNumber) {
      if (
        typeof whatsAppPhoneNumber !== "string" ||
        whatsAppPhoneNumber.length < 3 ||
        whatsAppPhoneNumber.length > 20
      ) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidBusinessWhatsAppPhoneNumber,
          message: "BusinessController, update business - invalid WhatsApp phone number",
        });
      }
      updateObj.whatsAppPhoneNumber = whatsAppPhoneNumber;
    }

    if (workingHours) {
      if (!Array.isArray(workingHours)) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidBusinessWorkingHours,
          message: "BusinessController, update business - workingHours must be an array",
        });
      }

      const weeklySchedule = business.schedule?.weekly || {};
      for (const item of workingHours) {
        const day = item.day;
        if (typeof day !== "number" || day < 0 || day > 6) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidBusinessWorkingHours,
            message: "BusinessController, update business - invalid workingHours day",
          });
        }

        const periods = item.periods;
        if (periods && !Array.isArray(periods)) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidBusinessWorkingHours,
            message: "BusinessController, update business - invalid workingHours periods",
          });
        }

        const enabled = item.enabled;
        if (typeof enabled !== "boolean") {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidBusinessWorkingHours,
            message: "BusinessController, update business - invalid workingHours enabled",
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
          code: Const.responsecodeInvalidBusinessScheduleException,
          message: "BusinessController, update business - exceptions must be an array",
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
            code: Const.responsecodeInvalidBusinessScheduleException,
            message: "BusinessController, update business - invalid schedule exception date",
          });
        }
        if (typeof exception.enabled !== "boolean") {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidBusinessScheduleException,
            message: "BusinessController, update business - invalid schedule exception enabled",
          });
        }
        if (exception.periods && !Array.isArray(exception.periods)) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidBusinessScheduleException,
            message: "BusinessController, update business - invalid schedule exception periods",
          });
        }
      }

      updateObj["schedule.exceptions"] = exceptions;
    }

    if (address && typeof address === "object") {
      updateObj.address = address;
    }

    if (market) {
      if (!countries[market]) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidBusinessMarket,
          message: "BusinessController, update business - invalid market",
        });
      }

      updateObj.market = market;
    }

    if (tagIds && !Array.isArray(tagIds)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidBusinessTag,
        message: "BusinessController, update business - tagIds must be an array",
      });
    }

    if (tagIds.length > 0) {
      const tagMap = {};

      businessTags.forEach((t) => {
        tagMap[t.id] = t;
      });

      tagIds.forEach((t) => {
        if (!tagMap[t]) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidBusinessTag,
            message: "BusinessController, update business - invalid tag ID",
          });
        }

        if (tagMap[t].regulated) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidBusinessTag,
            message: "BusinessController, update business - regulated tag ID not allowed",
          });
        }
      });

      updateObj["tagIds"] = tagIds;
    }

    const updatedBusiness = await Business.findByIdAndUpdate(businessId, updateObj, {
      new: true,
      lean: true,
    });

    Base.successResponse(response, Const.responsecodeSucceed, { business: updatedBusiness });
  } catch (error) {
    return Base.newErrorResponse({
      response,
      code: Const.httpCodeServerError,
      message: "BusinessController, update business",
      error,
    });
  }
});

module.exports = router;
