"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, countries } = require("#config");
const { auth } = require("#middleware");
const { CreditConversionRate, PaymentLog } = require("#models");

/**
 * @api {get} /api/v2/credits/rate/:countryCode Get credit conversion rate flom_v1
 * @apiVersion 2.0.11
 * @apiName  Get credit conversion rate flom_v1
 * @apiGroup WebAPI Credit Conversion Rate
 * @apiDescription  API fetches credit conversion rate.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1660731589933,
 *     "data": {
 *         "creditConversionRate": {
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

      const creditConversionRate = await CreditConversionRate.findOne({ countryCode }).lean();

      Base.successResponse(response, Const.responsecodeSucceed, {
        creditConversionRate: creditConversionRate ?? {},
      });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "CreditConversionRateController, GET",
        error,
      });
    }
  },
);

/**
 * @api {get} /api/v2/credits/rate Get credit conversion rates flom_v1
 * @apiVersion 2.0.12
 * @apiName  Get credit conversion rates flom_v1
 * @apiGroup WebAPI Credit Conversion Rate
 * @apiDescription  API fetches credit conversion rates.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1660731589933,
 *     "data": {
 *         "creditConversionRates": [
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
    const creditConversionRates = await CreditConversionRate.find({}).lean();

    Base.successResponse(response, Const.responsecodeSucceed, {
      creditConversionRates: creditConversionRates ?? [],
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "CreditConversionRateController, GET",
      error,
    });
  }
});

/**
 * @api {post} /api/v2/credits/rate Create credit conversion rate flom_v1
 * @apiVersion 2.0.12
 * @apiName  Create credit conversion rate flom_v1
 * @apiGroup WebAPI Credit Conversion Rate
 * @apiDescription  API creates credit conversion rate.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiParam {String}   countryCode  Country code of credit conversion rate ("default" if this value applies to all countries)
 * @apiParam {Number}   value        Amount of credits that can be exchanged for 1 USD for that country (-1 if conversion is to be unavailable in country)
 *
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1660731589933,
 *     "data": {
 *         "creditConversionRate": {
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
 * @apiError (Errors) 443745  Credit conversion rate with given country code already exists
 * @apiError (Errors) 4000007 Token invalid
 */

router.post("/", auth({ allowAdmin: true, role: Const.Role.ADMIN }), async (request, response) => {
  try {
    const { errorCode, errorMessage, countryCode, value } = checkParams(request.body);

    if (errorCode) {
      return Base.newErrorResponse({
        response,
        code: errorCode,
        message: `CreditConversionRateController, POST - ${errorMessage}`,
      });
    }

    const alreadyExists = await CreditConversionRate.findOne({ countryCode }).lean();
    if (alreadyExists) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeCreditConversionRateAlreadyExists,
        message: `CreditConversionRateController, POST - credit conversion rate with given country code already exists`,
      });
    }

    const creditConversionRate = await CreditConversionRate.create({ countryCode, value });

    Base.successResponse(response, Const.responsecodeSucceed, {
      creditConversionRate: creditConversionRate.toObject(),
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "CreditConversionRateController, POST",
      error,
    });
  }
});

/**
 * @api {patch} /api/v2/credits/rate/:countryCode Update credit conversion rate flom_v1
 * @apiVersion 2.0.12
 * @apiName  Update credit conversion rate flom_v1
 * @apiGroup WebAPI Credit Conversion Rate
 * @apiDescription  API updates credit conversion rate.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiParam {Number}  value  Amount of credits that can be exchanged for 1 USD for that country (-1 if conversion is to be unavailable in country)
 *
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1660731589933,
 *     "data": {
 *         "updatedCreditConversionRate": {
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
 * @apiError (Errors) 443741  Invalid values parameter
 * @apiError (Errors) 443746  Credit conversion rate with that country code does not exist
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
          message: `CreditConversionRateController, PATCH - ${errorMessage}`,
        });
      }

      const exists = await CreditConversionRate.findOne({ countryCode }).lean();
      if (!exists) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeCreditConversionRateDoesNotExist,
          message: `CreditConversionRateController, PATCH - credit conversion rate with given country code does not exist`,
        });
      }

      const updatedCreditConversionRate = await CreditConversionRate.findOneAndUpdate(
        { countryCode },
        { value },
        { new: true },
      );

      PaymentLog.create({
        type: 5,
        oldValue: exists,
        newValue: updatedCreditConversionRate,
        adminUserId: user?._id.toString(),
        adminUsername: user?.name || user?.username,
      });

      Base.successResponse(response, Const.responsecodeSucceed, {
        updatedCreditConversionRate: updatedCreditConversionRate.toObject(),
      });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "CreditConversionRateController, PATCH",
        error,
      });
    }
  },
);

/**
 * @api {delete} /api/v2/credits/rate/:countryCode Delete credit conversion rate flom_v1
 * @apiVersion 2.0.12
 * @apiName  Delete credit conversion rate flom_v1
 * @apiGroup WebAPI Credit Conversion Rate
 * @apiDescription  API deletes credit conversion rate.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1660731589933,
 *     "data": {
 *         "deletedCreditConversionRate": {
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
 * @apiError (Errors) 443746  Credit conversion rate with that country code does not exist
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
          message: `CreditConversionRateController, DELETE - no countryCode parameter`,
        });
      }

      const exists = await CreditConversionRate.findOne({ countryCode }).lean();
      if (!exists) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeCreditConversionRateDoesNotExist,
          message: `CreditConversionRateController, DELETE - credit conversion rate with given country code does not exist`,
        });
      }

      const deletedCreditConversionRate = await CreditConversionRate.findOneAndRemove({
        countryCode,
      });

      PaymentLog.create({
        type: 5,
        oldValue: exists,
        newValue: null,
        adminUserId: user?._id.toString(),
        adminUsername: user?.name || user?.username,
      });

      Base.successResponse(response, Const.responsecodeSucceed, {
        deletedCreditConversionRate: deletedCreditConversionRate.toObject(),
      });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "CreditConversionRateController, DELETE",
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
