"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, countries } = require("#config");
const { auth } = require("#middleware");
const { PayoutLimit, PaymentLog } = require("#models");

/**
 * @api {get} /api/v2/admin-page/payout/limits/:countryCode Get payout limit flom_v1
 * @apiVersion 2.0.11
 * @apiName  Get payout limit flom_v1
 * @apiGroup WebAPI Admin page - Payouts
 * @apiDescription  API fetches payout limit.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1673272569565,
 *     "data": {
 *         "payoutLimit": {
 *             "_id": "63bc1c693424b02e382b331e",
 *             "min": 2,
 *             "max": 100,
 *             "created": 1673272425211,
 *             "modified": 1673272425211,
 *             "countryCode": "NG",
 *             "__v": 0
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

      const payoutLimit = await PayoutLimit.findOne({ countryCode }).lean();

      Base.successResponse(response, Const.responsecodeSucceed, {
        payoutLimit: payoutLimit ?? {},
      });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "PayoutLimitsController, GET",
        error,
      });
    }
  },
);

/**
 * @api {get} /api/v2/admin-page/payout/limits Get payout limits flom_v1
 * @apiVersion 2.0.12
 * @apiName  Get payout limits flom_v1
 * @apiGroup WebAPI Admin page - Payouts
 * @apiDescription  API fetches payout limits.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1673272604320,
 *     "data": {
 *         "payoutLimits": [
 *             {
 *                 "_id": "63bc1c433424b02e382b331d",
 *                 "min": 2,
 *                 "max": 500,
 *                 "created": 1673272387434,
 *                 "modified": 1673272387434,
 *                 "countryCode": "HR",
 *                 "__v": 0
 *             },
 *             {
 *                 "_id": "63bc1c693424b02e382b331e",
 *                 "min": 2,
 *                 "max": 100,
 *                 "created": 1673272425211,
 *                 "modified": 1673272425211,
 *                 "countryCode": "NG",
 *                 "__v": 0
 *             },
 *             {
 *                 "_id": "63bc1c7c3424b02e382b331f",
 *                 "min": 10,
 *                 "max": 9007199254740991,
 *                 "created": 1673272444030,
 *                 "modified": 1673272444030,
 *                 "countryCode": "US",
 *                 "__v": 0
 *             },
 *             {
 *                 "_id": "63bc1ca23424b02e382b3320",
 *                 "min": 0,
 *                 "max": 1000,
 *                 "created": 1673272482012,
 *                 "modified": 1673272482012,
 *                 "countryCode": "FR",
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

router.get("/", auth({ allowAdmin: true, role: Const.Role.ADMIN }), async (request, response) => {
  try {
    const payoutLimits = await PayoutLimit.find({}).lean();

    Base.successResponse(response, Const.responsecodeSucceed, {
      payoutLimits: payoutLimits ?? [],
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "PayoutLimitsController, GET",
      error,
    });
  }
});

/**
 * @api {post} /api/v2/admin-page/payout/limits Create payout limit flom_v1
 * @apiVersion 2.0.12
 * @apiName  Create payout limit flom_v1
 * @apiGroup WebAPI Admin page - Payouts
 * @apiDescription  API creates payout limit.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiParam {String} countryCode Country code of payout limit ("default" if this limit applies to all countries)
 * @apiParam {Number} min         Minimum amount of USD that can be paid out with credits for this country (only whole numbers allowed)
 * @apiParam {Number} max         Maximum amount of USD that can be paid out with credits for this country (only whole numbers allowed)
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1673272482056,
 *     "data": {
 *         "payoutLimit": {
 *             "min": 0,
 *             "max": 1000,
 *             "created": 1673272482012,
 *             "modified": 1673272482012,
 *             "_id": "63bc1ca23424b02e382b3320",
 *             "countryCode": "FR",
 *             "__v": 0
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
 * @apiError (Errors) 443760  Invalid min parameter
 * @apiError (Errors) 443761  Invalid max parameter
 * @apiError (Errors) 443762  Payout limit with given country code already exists
 * @apiError (Errors) 4000007 Token invalid
 */

router.post("/", auth({ allowAdmin: true, role: Const.Role.ADMIN }), async (request, response) => {
  try {
    const { errorCode, errorMessage, countryCode, min, max } = checkParams(request.body);

    if (errorCode) {
      return Base.newErrorResponse({
        response,
        code: errorCode,
        message: `PayoutLimitsController, POST - ${errorMessage}`,
      });
    }

    const alreadyExists = await PayoutLimit.findOne({ countryCode }).lean();
    if (alreadyExists) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodePayoutLimitAlreadyExists,
        message: `PayoutLimitsController, POST - payout limit with given country code already exists`,
      });
    }

    const payoutLimit = await PayoutLimit.create({ countryCode, min, max });

    Base.successResponse(response, Const.responsecodeSucceed, {
      payoutLimit: payoutLimit.toObject(),
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "PayoutLimitsController, POST",
      error,
    });
  }
});

/**
 * @api {patch} /api/v2/admin-page/payout/limits/:countryCode Update payout limit flom_v1
 * @apiVersion 2.0.12
 * @apiName  Update payout limit flom_v1
 * @apiGroup WebAPI Admin page - Payouts
 * @apiDescription  API updates payout limit.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiParam {Number} [min] Minimum amount of USD that can be paid out with credits for this country (only whole numbers allowed)
 * @apiParam {Number} [max] Maximum amount of USD that can be paid out with credits for this country (only whole numbers allowed)
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1673272783766,
 *     "data": {
 *         "updatedPayoutLimit": {
 *             "min": 0,
 *             "max": 900,
 *             "created": 1673272482012,
 *             "modified": 1673272783716,
 *             "_id": "63bc1ca23424b02e382b3320",
 *             "countryCode": "FR",
 *             "__v": 0
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
 * @apiError (Errors) 443740  No countryCode parameter
 * @apiError (Errors) 443691  Invalid countryCode parameter
 * @apiError (Errors) 443760  Invalid min parameter
 * @apiError (Errors) 443761  Invalid max parameter
 * @apiError (Errors) 443763  Payout limit with that country code does not exist
 * @apiError (Errors) 4000007 Token invalid
 */

router.patch(
  "/:countryCode",
  auth({ allowAdmin: true, role: Const.Role.ADMIN }),
  async (request, response) => {
    try {
      const updateObj = checkParams(
        {
          countryCode: request.params.countryCode,
          min: request.body.min,
          max: request.body.max,
        },
        true,
      );
      const user = request.user;

      if (updateObj.errorCode) {
        return Base.newErrorResponse({
          response,
          code: updateObj.errorCode,
          message: `PayoutLimitsController, PATCH - ${updateObj.errorMessage}`,
        });
      }

      delete updateObj.countryCode;

      const exists = await PayoutLimit.findOne({
        countryCode: request.params.countryCode,
      }).lean();
      if (!exists) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodePayoutLimitDoesNotExist,
          message: `PayoutLimitsController, PATCH - payout limit with given country code does not exist`,
        });
      }

      const updatedPayoutLimit = await PayoutLimit.findOneAndUpdate(
        { countryCode: request.params.countryCode },
        { ...updateObj, modified: Date.now() },
        { new: true },
      );

      PaymentLog.create({
        type: 3,
        oldValue: exists,
        newValue: updatedPayoutLimit,
        adminUserId: user?._id.toString(),
        adminUsername: user?.name || user?.username,
      });

      Base.successResponse(response, Const.responsecodeSucceed, {
        updatedPayoutLimit: updatedPayoutLimit.toObject(),
      });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "PayoutLimitsController, PATCH",
        error,
      });
    }
  },
);

/**
 * @api {delete} /api/v2/admin-page/payout/limits/:countryCode Delete payout limit flom_v1
 * @apiVersion 2.0.12
 * @apiName  Delete payout limit flom_v1
 * @apiGroup WebAPI Admin page - Payouts
 * @apiDescription  API deletes payout limit.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1673272952131,
 *     "data": {
 *         "deletedPayoutLimit": {
 *             "min": 50,
 *             "max": 900,
 *             "created": 1673272482012,
 *             "modified": 1673272925085,
 *             "_id": "63bc1ca23424b02e382b3320",
 *             "countryCode": "FR",
 *             "__v": 0
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
 * @apiError (Errors) 443763  Payout limit with that country code does not exist
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
          message: `PayoutLimitsController, DELETE - no countryCode parameter`,
        });
      }

      const exists = await PayoutLimit.findOne({ countryCode }).lean();
      if (!exists) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodePayoutLimitDoesNotExist,
          message: `PayoutLimitsController, DELETE - payout limit with given country code does not exist`,
        });
      }

      const deletedPayoutLimit = await PayoutLimit.findOneAndRemove({
        countryCode,
      });

      PaymentLog.create({
        type: 3,
        oldValue: exists,
        newValue: null,
        adminUserId: user?._id.toString(),
        adminUsername: user?.name || user?.username,
      });

      Base.successResponse(response, Const.responsecodeSucceed, {
        deletedPayoutLimit: deletedPayoutLimit.toObject(),
      });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "PayoutLimitsController, DELETE",
        error,
      });
    }
  },
);

function checkParams({ countryCode, min, max }, isUpdate = false) {
  const returnObj = { errorCode: null };

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

  returnObj.countryCode = countryCode;

  if (min !== null && min !== undefined) {
    if (!Number.isInteger(min) || isNaN(min)) {
      return {
        errorCode: Const.responsecodeInvalidMinParameter,
        errorMessage: `invalid min parameter`,
      };
    }

    returnObj.min = min;
  } else if (!isUpdate) {
    return {
      errorCode: Const.responsecodeInvalidMinParameter,
      errorMessage: `invalid min parameter`,
    };
  }

  if (max !== null && max !== undefined) {
    if (!Number.isInteger(max) || isNaN(max)) {
      return {
        errorCode: Const.responsecodeInvalidMaxParameter,
        errorMessage: `invalid max parameter`,
      };
    }

    returnObj.max = max;
  } else if (!isUpdate) {
    return {
      errorCode: Const.responsecodeInvalidMaxParameter,
      errorMessage: `invalid max parameter`,
    };
  }

  return returnObj;
}

module.exports = router;
