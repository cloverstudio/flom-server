"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, countries } = require("#config");
const { auth } = require("#middleware");
const { SprayValue, PaymentLog } = require("#models");

/**
 * @api {get} /api/v2/admin-page/spray-bless/:countryCode Get spray bless value flom_v1
 * @apiVersion 2.0.12
 * @apiName  Get spray bless value flom_v1
 * @apiGroup WebAPI Admin page - Spray Bless
 * @apiDescription  API fetches spray bless value.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1660731589933,
 *     "data": {
 *         "sprayValue": {
 *             "countryCode": "HR",
 *             "value": 5,
 *             "created": 1234567890
 *         }
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
  "/:countryCode",
  auth({ allowAdmin: true, role: Const.Role.ADMIN }),
  async (request, response) => {
    try {
      const countryCode = request.params.countryCode;

      const sprayValue = await SprayValue.findOne({ countryCode }).lean();

      Base.successResponse(response, Const.responsecodeSucceed, { sprayValue: sprayValue ?? {} });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "SprayBlessController, GET",
        error,
      });
    }
  },
);

/**
 * @api {get} /api/v2/admin-page/spray-bless Get spray bless values flom_v1
 * @apiVersion 2.0.12
 * @apiName  Get spray bless values flom_v1
 * @apiGroup WebAPI Admin page - Spray Bless
 * @apiDescription  API fetches spray bless values.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1660731589933,
 *     "data": {
 *         "sprayValues": [
 *             {
 *                 "countryCode": "HR",
 *                 "value": 5,
 *                 "created": 1234567890
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

router.get("/", auth({ allowAdmin: true, role: Const.Role.ADMIN }), async (request, response) => {
  try {
    const sprayValues = await SprayValue.find({}).lean();

    Base.successResponse(response, Const.responsecodeSucceed, {
      sprayValues: sprayValues ?? [],
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "SprayBlessController, GET",
      error,
    });
  }
});

/**
 * @api {post} /api/v2/admin-page/spray-bless Create spray bless value flom_v1
 * @apiVersion 2.0.12
 * @apiName  Create spray bless value flom_v1
 * @apiGroup WebAPI Admin page - Spray Bless
 * @apiDescription  API creates spray bless value.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiParam {String}   countryCode  Country code for spray bless value ("default" if this value applies to all countries)
 * @apiParam {Number}   value        Number of credits per one spray click for that country (-1 if spray is to be unavailable in country)
 *
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1660731589933,
 *     "data": {
 *         "sprayValue": {
 *             "countryCode": "HR",
 *             "value": 10,
 *             "created": 1234567890
 *         }
 *     }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443690  No countryCode parameter
 * @apiError (Errors) 443691  Invalid countryCode parameter
 * @apiError (Errors) 443740  No value parameter
 * @apiError (Errors) 443741  Invalid value parameter
 * @apiError (Errors) 443742  Spray value with given country code already exists
 * @apiError (Errors) 4000007 Token invalid
 */

router.post("/", auth({ allowAdmin: true, role: Const.Role.ADMIN }), async (request, response) => {
  try {
    const { errorCode, errorMessage, countryCode, value } = checkParams(request.body);

    if (errorCode) {
      return Base.newErrorResponse({
        response,
        code: errorCode,
        message: `SprayBlessController, POST - ${errorMessage}`,
      });
    }

    const alreadyExists = await SprayValue.findOne({ countryCode }).lean();
    if (alreadyExists) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeSprayValueAlreadyExists,
        message: `SprayBlessController, POST - spray value with given country code already exists`,
      });
    }

    const sprayValue = await SprayValue.create({ countryCode, value });

    Base.successResponse(response, Const.responsecodeSucceed, {
      sprayValue: sprayValue.toObject(),
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "SprayBlessController, POST",
      error,
    });
  }
});

/**
 * @api {patch} /api/v2/admin-page/spray-bless/:countryCode Update spray bless value flom_v1
 * @apiVersion 2.0.12
 * @apiName  Update spray bless value flom_v1
 * @apiGroup WebAPI Admin page - Spray Bless
 * @apiDescription  API updates spray bless value.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiParam {Number}  value  Number of credits per one spray click for that country (-1 if spray is to be unavailable in country)
 *
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1660731589933,
 *     "data": {
 *         "updatedSprayValue": {
 *             "countryCode": "HR",
 *             "value": 10,
 *             "created": 1234567890
 *         }
 *     }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443740  No id parameter
 * @apiError (Errors) 443701  Invalid values parameter
 * @apiError (Errors) 4000007 Token invalid
 */

router.patch(
  "/:countryCode",
  auth({ allowAdmin: true, role: Const.Role.ADMIN }),
  async (request, response) => {
    try {
      const { errorCode, errorMessage, countryCode, value } = checkParams({
        countryCode: request.params.countryCode,
        value: request.body.value,
      });
      const user = request.user;

      if (errorCode) {
        return Base.newErrorResponse({
          response,
          code: errorCode,
          message: `SprayBlessController, PATCH - ${errorMessage}`,
        });
      }

      const oldValue = await SprayValue.findOne({ countryCode }).lean();

      const updatedSprayValue = await SprayValue.findOneAndUpdate(
        { countryCode },
        { value },
        { new: true },
      );

      PaymentLog.create({
        type: 4,
        oldValue: oldValue,
        newValue: updatedSprayValue,
        adminUserId: user?._id.toString(),
        adminUsername: user?.name || user?.username,
      });

      Base.successResponse(response, Const.responsecodeSucceed, {
        updatedSprayValue: updatedSprayValue.toObject(),
      });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "SprayBlessController, PATCH",
        error,
      });
    }
  },
);

/**
 * @api {delete} /api/v2/admin-page/spray-bless/:countryCode Delete spray bless value flom_v1
 * @apiVersion 2.0.12
 * @apiName  Delete spray bless value flom_v1
 * @apiGroup WebAPI Admin page - Spray Bless
 * @apiDescription  API deletes spray bless value.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1660731589933,
 *     "data": {
 *         "deletedSprayValue": {
 *             "countryCode": "HR",
 *             "value": 10,
 *             "created": 1234567890
 *         }
 *     }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443690  No countryCode parameter
 * @apiError (Errors) 443743  Spray value with that country code does not exist
 * @apiError (Errors) 4000007 Token invalid
 */

router.delete(
  "/:countryCode",
  auth({ allowAdmin: true, role: Const.Role.ADMIN }),
  async (request, response) => {
    try {
      const countryCode = request.params.countryCode;
      const user = request.user;

      if (!countryCode) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeNoCountryCodeParameter,
          message: `SprayBlessController, DELETE - no countryCode parameter`,
        });
      }

      const exists = await SprayValue.findOne({ countryCode }).lean();
      if (!exists) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeSprayValueDoesNotExist,
          message: `SprayBlessController, DELETE - spray value with given country code does not exist`,
        });
      }

      const deletedSprayValue = await SprayValue.findOneAndRemove({ countryCode });

      PaymentLog.create({
        type: 4,
        oldValue: exists,
        newValue: null,
        adminUserId: user?._id.toString(),
        adminUsername: user?.name || user?.username,
      });
      Base.successResponse(response, Const.responsecodeSucceed, {
        deletedSprayValue: deletedSprayValue.toObject(),
      });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "SprayBlessController, DELETE",
        error,
      });
    }
  },
);

function checkParams({ countryCode, value }) {
  if (!countryCode)
    return {
      errorCode: Const.responsecodeNoCountryCodeParameter,
      errorMessage: "no countryCode parameter",
    };

  if (!countries[countryCode] && countryCode !== "default")
    return {
      errorCode: Const.responsecodeInvalidCountryCode,
      errorMessage: "invalid countryCode parameter",
    };

  if (value === null || value === undefined)
    return {
      errorCode: Const.responsecodeNoValueParameter,
      errorMessage: `no value parameter`,
    };

  if (!Number.isInteger(value) || isNaN(value))
    return {
      errorCode: Const.responsecodeInvalidValueParameter,
      errorMessage: `invalid value parameter`,
    };

  return { errorCode: null, countryCode, value };
}

module.exports = router;
