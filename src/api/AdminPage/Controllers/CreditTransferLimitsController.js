"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, countries } = require("#config");
const { auth } = require("#middleware");
const { CreditTransferLimit, PaymentLog } = require("#models");

/**
 * @api {get} /api/v2/admin-page/credit-limits/:countryCode Get credit transfer limit flom_v1
 * @apiVersion 2.0.12
 * @apiName  Get credit transfer limit flom_v1
 * @apiGroup WebAPI Admin page - Credits
 * @apiDescription  API fetches credit transfer limit.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1673609037554,
 *     "data": {
 *         "creditTransferLimit": {
 *             "_id": "63c13a491000c8215cb24782",
 *             "created": 1673607753348,
 *             "modified": 1673607753348,
 *             "countryCode": "NG",
 *             "senderDailyLimit": 20,
 *             "senderWeeklyLimit": 100,
 *             "senderMonthlyLimit": 400,
 *             "receiverDailyLimit": 50,
 *             "receiverWeeklyLimit": 200,
 *             "receiverMonthlyLimit": 600,
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
      const countryCode = request.params.countryCode ?? "XXXX";

      const creditTransferLimit = await CreditTransferLimit.findOne({ countryCode }).lean();

      Base.successResponse(response, Const.responsecodeSucceed, {
        creditTransferLimit: creditTransferLimit ?? {},
      });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "CreditTransferLimitsController, GET",
        error,
      });
    }
  },
);

/**
 * @api {get} /api/v2/admin-page/credit-limits Get credit transfer limits flom_v1
 * @apiVersion 2.0.12
 * @apiName  Get credit transfer limits flom_v1
 * @apiGroup WebAPI Admin page - Credits
 * @apiDescription  API fetches credit transfer limits.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1673609082266,
 *     "data": {
 *         "creditTransferLimits": [
 *             {
 *                 "_id": "63c1349d1000c8215cb24781",
 *                 "created": 1673606301568,
 *                 "modified": 1673606301569,
 *                 "countryCode": "default",
 *                 "senderDailyLimit": 50,
 *                 "senderWeeklyLimit": 200,
 *                 "senderMonthlyLimit": 1000,
 *                 "receiverDailyLimit": 100,
 *                 "receiverWeeklyLimit": 500,
 *                 "receiverMonthlyLimit": 2000,
 *                 "__v": 0
 *             },
 *             {
 *                 "_id": "63c13a491000c8215cb24782",
 *                 "created": 1673607753348,
 *                 "modified": 1673607753348,
 *                 "countryCode": "NG",
 *                 "senderDailyLimit": 20,
 *                 "senderWeeklyLimit": 100,
 *                 "senderMonthlyLimit": 400,
 *                 "receiverDailyLimit": 50,
 *                 "receiverWeeklyLimit": 200,
 *                 "receiverMonthlyLimit": 600,
 *                 "__v": 0
 *             },
 *             {
 *                 "_id": "63c13a6f1000c8215cb24783",
 *                 "created": 1673607791990,
 *                 "modified": 1673608943565,
 *                 "countryCode": "flom",
 *                 "senderDailyLimit": 500,
 *                 "senderWeeklyLimit": 500,
 *                 "senderMonthlyLimit": null,
 *                 "__v": 0,
 *                 "receiverDailyLimit": null,
 *                 "receiverMonthlyLimit": null,
 *                 "receiverWeeklyLimit": null
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
    const creditTransferLimits = await CreditTransferLimit.find({}).lean();

    Base.successResponse(response, Const.responsecodeSucceed, {
      creditTransferLimits: creditTransferLimits ?? [],
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "CreditTransferLimitsController, GET",
      error,
    });
  }
});

/**
 * @api {post} /api/v2/admin-page/credit-limits Create credit transfer limit flom_v1
 * @apiVersion 2.0.12
 * @apiName  Create credit transfer limit flom_v1
 * @apiGroup WebAPI Admin page - Credits
 * @apiDescription  API creates credit transfer limit.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiParam {String} countryCode           Country code of credit transfer limit ("default" if limit applies to all countries or "flom" for Flom Agent)
 * @apiParam {Number} senderDailyLimit      Maximum amount of USD that can be sent in credits per day (only whole numbers allowed)
 * @apiParam {Number} senderWeeklyLimit     Maximum amount of USD that can be sent in credits per week (only whole numbers allowed)
 * @apiParam {Number} senderMonthlyLimit    Maximum amount of USD that can be sent in credits per month (only whole numbers allowed)
 * @apiParam {Number} receiverDailyLimit    Maximum amount of USD that can be received in credits per day (only whole numbers allowed)
 * @apiParam {Number} receiverWeeklyLimit   Maximum amount of USD that can be received in credits per week (only whole numbers allowed)
 * @apiParam {Number} receiverMonthlyLimit  Maximum amount of USD that can be received in credits per month (only whole numbers allowed)
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1673609037554,
 *     "data": {
 *         "creditTransferLimit": {
 *             "_id": "63c13a491000c8215cb24782",
 *             "created": 1673607753348,
 *             "modified": 1673607753348,
 *             "countryCode": "NG",
 *             "senderDailyLimit": 20,
 *             "senderWeeklyLimit": 100,
 *             "senderMonthlyLimit": 400,
 *             "receiverDailyLimit": 50,
 *             "receiverWeeklyLimit": 200,
 *             "receiverMonthlyLimit": 600,
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
 * @apiError (Errors) 443764  Missing limit parameter
 * @apiError (Errors) 443765  Invalid limit parameter
 * @apiError (Errors) 443766  Credit transfer limit with given country code already exists
 * @apiError (Errors) 4000007 Token invalid
 */

router.post("/", auth({ allowAdmin: true, role: Const.Role.ADMIN }), async (request, response) => {
  try {
    const params = checkParams(request.body);

    if (params.errorCode) {
      return Base.newErrorResponse({
        response,
        code: params.errorCode,
        message: `CreditTransferLimitsController, POST - ${params.errorMessage}`,
        param: params.param,
      });
    }

    const alreadyExists = await CreditTransferLimit.findOne({
      countryCode: params.countryCode,
    }).lean();
    if (alreadyExists) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeCreditTransferLimitAlreadyExists,
        message: `CreditTransferLimitsController, POST - credit transfer limit with given country code already exists`,
      });
    }

    const creditTransferLimit = await CreditTransferLimit.create({ ...params });

    Base.successResponse(response, Const.responsecodeSucceed, {
      creditTransferLimit: creditTransferLimit.toObject(),
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "CreditTransferLimitsController, POST",
      error,
    });
  }
});

/**
 * @api {patch} /api/v2/admin-page/credit-limits/:countryCode Update credit transfer limit flom_v1
 * @apiVersion 2.0.12
 * @apiName  Update credit transfer limit flom_v1
 * @apiGroup WebAPI Admin page - Credits
 * @apiDescription  API updates credit transfer limit.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiParam {Number} [senderDailyLimit]      Maximum amount of USD that can be sent in credits per day (only whole numbers allowed)
 * @apiParam {Number} [senderWeeklyLimit]     Maximum amount of USD that can be sent in credits per week (only whole numbers allowed)
 * @apiParam {Number} [senderMonthlyLimit]    Maximum amount of USD that can be sent in credits per month (only whole numbers allowed)
 * @apiParam {Number} [receiverDailyLimit]    Maximum amount of USD that can be received in credits per day (only whole numbers allowed)
 * @apiParam {Number} [receiverWeeklyLimit]   Maximum amount of USD that can be received in credits per week (only whole numbers allowed)
 * @apiParam {Number} [receiverMonthlyLimit]  Maximum amount of USD that can be received in credits per month (only whole numbers allowed)
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1673608995774,
 *     "data": {
 *         "updatedCreditTransferLimit": {
 *             "created": 1673608981512,
 *             "modified": 1673608981513,
 *             "_id": "63c13f15298ee82c6c5b212c",
 *             "countryCode": "HR",
 *             "senderDailyLimit": 500,
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
 * @apiError (Errors) 443765  Invalid limit parameter
 * @apiError (Errors) 443767  Credit transfer limit with that id does not exist
 * @apiError (Errors) 4000007 Token invalid
 */

router.patch(
  "/:countryCode",
  auth({ allowAdmin: true, role: Const.Role.ADMIN }),
  async (request, response) => {
    try {
      const user = request.user;
      const countryCodeInput = request.params.countryCode ?? "XXXX";

      const { countryCode, ...params } = checkParams(
        {
          countryCode: countryCodeInput,
          ...request.body,
        },
        true,
      );

      if (params.errorCode) {
        return Base.newErrorResponse({
          response,
          code: params.errorCode,
          message: `CreditTransferLimitsController, PATCH - ${params.errorMessage}`,
          param: params.param,
        });
      }

      const exists = await CreditTransferLimit.findOne({ countryCode }).lean();

      if (!exists) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeCreditTransferLimitDoesNotExist,
          message: `CreditTransferLimitsController, PATCH - credit transfer limit with given country code does not exist`,
        });
      }

      const updatedCreditTransferLimit = await CreditTransferLimit.findOneAndUpdate(
        { countryCode },
        {
          $set: { ...params, modified: Date.now() },
        },
        { new: true },
      ).lean();

      PaymentLog.create({
        type: 6,
        oldValue: exists,
        newValue: updatedCreditTransferLimit,
        adminUserId: user?._id.toString(),
        adminUsername: user?.name || user?.username,
      });

      Base.successResponse(response, Const.responsecodeSucceed, {
        updatedCreditTransferLimit,
      });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "CreditTransferLimitsController, PATCH",
        error,
      });
    }
  },
);

/**
 * @api {delete} /api/v2/admin-page/credit-limits/:countryCode Delete credit transfer limit flom_v1
 * @apiVersion 2.0.12
 * @apiName  Delete credit transfer limit flom_v1
 * @apiGroup WebAPI Admin page - Credits
 * @apiDescription  API deletes credit transfer limit.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1673608995774,
 *     "data": {
 *         "deletedCreditTransferLimit": {
 *             "created": 1673608981512,
 *             "modified": 1673608981513,
 *             "_id": "63c13f15298ee82c6c5b212c",
 *             "countryCode": "HR",
 *             "senderDailyLimit": 500,
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
 * @apiError (Errors) 443767  Credit transfer limit with that country code does not exist
 * @apiError (Errors) 4000007 Token invalid
 */

router.delete(
  "/:countryCode",
  auth({ allowAdmin: true, role: Const.Role.ADMIN }),
  async (request, response) => {
    try {
      const user = request.user;
      const countryCode = request.params.countryCode ?? "XXXX";

      const exists = await CreditTransferLimit.findOne({ countryCode }).lean();
      if (!exists) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeCreditTransferLimitDoesNotExist,
          message: `CreditTransferLimitsController, DELETE - credit transfer limit with given country code does not exist`,
        });
      }

      const deletedCreditTransferLimit = await CreditTransferLimit.findOneAndRemove({
        countryCode,
      });

      PaymentLog.create({
        type: 6,
        oldValue: exists,
        newValue: null,
        adminUserId: user?._id.toString(),
        adminUsername: user?.name || user?.username,
      });

      Base.successResponse(response, Const.responsecodeSucceed, {
        deletedCreditTransferLimit: deletedCreditTransferLimit.toObject(),
      });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "CreditTransferLimitsController, DELETE",
        error,
      });
    }
  },
);

function checkParams(inputObj, isUpdate = false) {
  const createOperationKeys = [
    "senderDailyLimit",
    "senderWeeklyLimit",
    "senderMonthlyLimit",
    "receiverDailyLimit",
    "receiverWeeklyLimit",
    "receiverMonthlyLimit",
  ];

  const { countryCode, ...restObj } = inputObj;

  if (!countryCode)
    return {
      errorCode: Const.responsecodeNoCountryCodeParameter,
      errorMessage: "no countryCode parameter",
    };

  if (!countries[countryCode] && countryCode !== "default" && countryCode !== "flom")
    return {
      errorCode: Const.responsecodeInvalidCountryCode,
      errorMessage: "invalid countryCode parameter",
    };

  if (!isUpdate) {
    const inputKeys = Object.keys(restObj);
    for (const createKey of createOperationKeys) {
      if (!inputKeys.includes(createKey)) {
        return {
          errorCode: Const.responsecodeMissingLimitParameter,
          errorMessage: `missing limit parameter - ${createKey}`,
          param: createKey,
        };
      }
    }
  }

  for (const key in restObj) {
    if (!createOperationKeys.includes(key)) {
      delete restObj[key];
      continue;
    }

    const limit = restObj[key];

    if (limit === null || limit === undefined || isNaN(limit)) {
      return {
        errorCode: Const.responsecodeInvalidLimitParameter,
        errorMessage: `invalid limit parameter - ${key}`,
        param: key,
      };
    }
  }
}

module.exports = router;
