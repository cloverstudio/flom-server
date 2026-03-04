"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, countries } = require("#config");
const { auth } = require("#middleware");
const { Fee, PaymentLog } = require("#models");

/**
 * @api {get} /api/v2/admin-page/fees/countries List countries with fees flom_v1
 * @apiVersion 2.0.11
 * @apiName  List countries with fees flom_v1
 * @apiGroup WebAPI Admin page - Fees
 * @apiDescription  API fetches a list of countries that have fees.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1677232763378,
 *     "data": {
 *         "countries": [
 *             "default",
 *             "HR",
 *             "US"
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

router.get(
  "/countries",
  auth({ allowAdmin: true, role: Const.Role.ADMIN }),
  async (request, response) => {
    try {
      const fees = await Fee.find({}, { countryCode: 1 }).lean();
      const feeCountries = [];
      fees.forEach((fee) => {
        if (!feeCountries.includes(fee.countryCode)) feeCountries.push(fee.countryCode);
      });
      feeCountries.sort();

      Base.successResponse(response, Const.responsecodeSucceed, {
        countries: feeCountries ?? {},
      });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "FeesController, List countries",
        error,
      });
    }
  },
);

/**
 * @api {get} /api/v2/admin-page/fees/:id Get fee by id flom_v1
 * @apiVersion 2.0.11
 * @apiName  Get fee flom_v1
 * @apiGroup WebAPI Admin page - Fees
 * @apiDescription  API fetches fee.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1676884219582,
 *     "data": {
 *         "fee": {
 *             "_id": "63f33894da58bc42c4e292ec",
 *             "base": {
 *                 "fixed": 0,
 *                 "percent": 0
 *             },
 *             "max": -1,
 *             "additional": {
 *                 "fixed": 0,
 *                 "percent": 0
 *             },
 *             "created": 1676884116747,
 *             "modified": 1676884116747,
 *             "countryCode": "default",
 *             "paymentMethodType": 1,
 *             "transferType": 0,
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
  "/:id",
  auth({ allowAdmin: true, role: Const.Role.ADMIN }),
  async (request, response) => {
    try {
      const feeId = request.params.id;

      const fee = await Fee.findById(feeId).lean();

      Base.successResponse(response, Const.responsecodeSucceed, {
        fee: fee ?? {},
      });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "FeesController, GET",
        error,
      });
    }
  },
);

/**
 * @api {get} /api/v2/admin-page/fees Get fees flom_v1
 * @apiVersion 2.0.12
 * @apiName  Get fees flom_v1
 * @apiGroup WebAPI Admin page - Fees
 * @apiDescription  API fetches fees. All query parameters are optional, so if they're all not included you will get a list of all fees.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiParam (Query string) {String} [countryCode]        Country code of fee ("default" for default fee)
 * @apiParam (Query string) {Number} [paymentMethodType]  Payment method of fee (1 - Credit card, 2 - PayPal, 3 - Bank account, 4 - Credit balance, 5 - Sats balance)
 * @apiParam (Query string) {Number} [transferType]       Transfer type of fee (1 - Top-up, 2 - Data, 3 - Super bless, 4 - Marketplace, 5 - Community/membership, 6 - Cash, 7 - Credit package, 8 - Credits, 9 - Spray bless, 10 - Sats, 99 - Payout)
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1676885588121,
 *     "data": {
 *         "fees": [
 *             {
 *                 "_id": "63f339fc5998120f4c30a044",
 *                 "base": {
 *                     "fixed": 1,
 *                     "percent": 0.5
 *                 },
 *                 "max": 10,
 *                 "additional": {
 *                     "fixed": 0,
 *                     "percent": 0
 *                 },
 *                 "created": 1676884476977,
 *                 "modified": 1676884476977,
 *                 "countryCode": "US",
 *                 "paymentMethodType": 1,
 *                 "transferType": 0,
 *                 "__v": 0
 *             },
 *             {
 *                 "_id": "63f33dc55998120f4c30a045",
 *                 "base": {
 *                     "fixed": 1,
 *                     "percent": 0.5
 *                 },
 *                 "max": 10,
 *                 "additional": {
 *                     "fixed": 0,
 *                     "percent": 0
 *                 },
 *                 "created": 1676885445225,
 *                 "modified": 1676885445225,
 *                 "countryCode": "US",
 *                 "paymentMethodType": 2,
 *                 "transferType": 0,
 *                 "__v": 0
 *             },
 *             {
 *                 "_id": "63f33dc95998120f4c30a046",
 *                 "base": {
 *                     "fixed": 1,
 *                     "percent": 0.5
 *                 },
 *                 "max": 10,
 *                 "additional": {
 *                     "fixed": 0,
 *                     "percent": 0
 *                 },
 *                 "created": 1676885449061,
 *                 "modified": 1676885449061,
 *                 "countryCode": "US",
 *                 "paymentMethodType": 3,
 *                 "transferType": 0,
 *                 "__v": 0
 *             },
 *             {
 *                 "_id": "63f33dcc5998120f4c30a047",
 *                 "base": {
 *                     "fixed": 2,
 *                     "percent": 1
 *                 },
 *                 "max": 15,
 *                 "additional": {
 *                     "fixed": 0,
 *                     "percent": 0
 *                 },
 *                 "created": 1676885452943,
 *                 "modified": 1676885507366,
 *                 "countryCode": "US",
 *                 "paymentMethodType": 4,
 *                 "transferType": 0,
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
 * @apiError (Errors) 443691  Invalid countryCode parameter
 * @apiError (Errors) 443091  Invalid payment method type parameter
 * @apiError (Errors) 443093  Invalid transfer type parameter
 * @apiError (Errors) 4000007 Token invalid
 */

router.get("/", auth({ allowAdmin: true, role: Const.Role.ADMIN }), async (request, response) => {
  try {
    const { countryCode, paymentMethodType, transferType } = request.query;

    const query = {};

    if (countryCode && !countries[countryCode] && countryCode !== "default") {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidCountryCode,
        message: `FeesController, GET list - invalid countryCode parameter`,
      });
    } else if (countryCode) {
      query.countryCode = countryCode;
    }

    if (paymentMethodType && !Const.paymentMethods.includes(+paymentMethodType)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodePaymentMethodNotFound,
        message: `FeesController, GET list - invalid paymentMethod parameter`,
      });
    } else if (paymentMethodType) {
      query.paymentMethodType = +paymentMethodType;
    }

    if (transferType && !Const.transferTypes.includes(+transferType)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeTransferTypeNotFound,
        message: `FeesController, GET list - invalid transferType parameter`,
      });
    } else if (transferType) {
      query.transferType = +transferType;
    }

    const fees = await Fee.find(query).lean();

    Base.successResponse(response, Const.responsecodeSucceed, {
      fees: fees ?? [],
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "FeesController, GET",
      error,
    });
  }
});

/**
 * @api {post} /api/v2/admin-page/fees Create fee flom_v1
 * @apiVersion 2.0.12
 * @apiName  Create fee flom_v1
 * @apiGroup WebAPI Admin page - Fees
 * @apiDescription  API creates fee.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiParam {String} countryCode          Country code of fee ("default" for default fee)
 * @apiParam {Number} paymentMethodType    Payment method of fee (1 - Credit card, 2 - PayPal, 3 - Bank account, 4 - Credit balance, 5 - Sats balance)
 * @apiParam {Number} transferType         Transfer type of fee (1 - Top-up, 2 - Data, 3 - Super bless, 4 - Marketplace, 5 - Community/membership, 6 - Cash, 7 - Credit package, 8 - Credits, 9 - Spray bless, 10 - Sats, 99 - Payout)
 * @apiParam {Number} [baseFixed]          Fixed part of the base fee (default: 0)
 * @apiParam {Number} [basePercent]        Percentage part of the base fee (default: 0) (actual percentage, as in 10(%), not 0.1)
 * @apiParam {Number} [max]                Maximum fee amount, -1 if no limit (default: -1)
 * @apiParam {Number} [additionalFixed]    Fixed part of the additional fee (default: 0)
 * @apiParam {Number} [additionalPercent]  Percentage part of the additional fee (default: 0) (actual percentage, as in 10(%), not 0.1)
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1676884116800,
 *     "data": {
 *         "fee": {
 *             "base": {
 *                 "fixed": 0,
 *                 "percent": 0
 *             },
 *             "max": -1,
 *             "additional": {
 *                 "fixed": 0,
 *                 "percent": 0
 *             },
 *             "created": 1676884116747,
 *             "modified": 1676884116747,
 *             "_id": "63f33894da58bc42c4e292ec",
 *             "countryCode": "default",
 *             "paymentMethodType": 1,
 *             "transferType": 0,
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
 * @apiError (Errors) 443091  Invalid payment method type parameter
 * @apiError (Errors) 443093  Invalid transfer type parameter
 * @apiError (Errors) 443770  Invalid fee parameter
 * @apiError (Errors) 443771  Fee with given country code, payment method and transfer type already exists
 * @apiError (Errors) 4000007 Token invalid
 */

router.post("/", auth({ allowAdmin: true, role: Const.Role.ADMIN }), async (request, response) => {
  try {
    const {
      errorCode,
      errorMessage,
      param,
      countryCode,
      paymentMethodType,
      transferType,
      baseFixed,
      basePercent,
      max,
      additionalFixed,
      additionalPercent,
    } = checkParams(request.body);

    if (errorCode) {
      return Base.newErrorResponse({
        response,
        code: errorCode,
        message: `FeesController, POST - ${errorMessage}`,
        param,
      });
    }

    const alreadyExists = await Fee.findOne({
      countryCode,
      paymentMethodType,
      transferType,
    }).lean();
    if (alreadyExists) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeFeeAlreadyExists,
        message: `FeesController, POST - fee with given country code, payment method and transfer type already exists`,
      });
    }

    const feeObj = {
      countryCode,
      paymentMethodType,
      transferType,
      base: { fixed: baseFixed ?? 0, percent: basePercent ?? 0 },
      max,
      additional: {
        fixed: additionalFixed ?? 0,
        percent: additionalPercent ?? 0,
      },
    };

    const fee = await Fee.create(feeObj);

    Base.successResponse(response, Const.responsecodeSucceed, {
      fee: fee.toObject(),
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "FeesController, POST",
      error,
    });
  }
});

/**
 * @api {patch} /api/v2/admin-page/fees/:id Update fee flom_v1
 * @apiVersion 2.0.12
 * @apiName  Update fee flom_v1
 * @apiGroup WebAPI Admin page - Fees
 * @apiDescription  API updates fee.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiParam {Number} [baseFixed]          Fixed part of the base fee
 * @apiParam {Number} [basePercent]        Percentage part of the base fee (actual percentage, as in 10(%), not 0.1)
 * @apiParam {Number} [max]                Maximum fee amount, -1 if no limit
 * @apiParam {Number} [additionalFixed]    Fixed part of the additional fee
 * @apiParam {Number} [additionalPercent]  Percentage part of the additional fee (actual percentage, as in 10(%), not 0.1)
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1676885507413,
 *     "data": {
 *         "updatedFee": {
 *             "base": {
 *                 "fixed": 2,
 *                 "percent": 1
 *             },
 *             "max": 15,
 *             "additional": {
 *                 "fixed": 0,
 *                 "percent": 0
 *             },
 *             "created": 1676885452943,
 *             "modified": 1676885507366,
 *             "_id": "63f33dcc5998120f4c30a047",
 *             "countryCode": "US",
 *             "paymentMethodType": 4,
 *             "transferType": 0,
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
 * @apiError (Errors) 443770  Invalid fee parameter
 * @apiError (Errors) 443772  Fee with given id does not exist
 * @apiError (Errors) 4000007 Token invalid
 */

router.patch(
  "/:id",
  auth({ allowAdmin: true, role: Const.Role.ADMIN }),
  async (request, response) => {
    try {
      const feeId = request.params.id;
      const updateObj = checkParams(request.body, true);
      const user = request.user;

      if (updateObj.errorCode) {
        return Base.newErrorResponse({
          response,
          code: updateObj.errorCode,
          message: `FeesController, PATCH - ${updateObj.errorMessage}`,
          param: updateObj.param,
        });
      }

      const exists = await Fee.findById(feeId).lean();
      if (!exists) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeFeeDoesNotExist,
          message: `FeesController, PATCH - fee with given id does not exist`,
        });
      }

      const newFeeObj = {
        base: {
          fixed: updateObj.baseFixed ?? exists.base.fixed,
          percent: updateObj.basePercent ?? exists.base.percent,
        },
        max: updateObj.max ?? exists.max,
        additional: {
          fixed: updateObj.additionalFixed ?? exists.additional.fixed,
          percent: updateObj.additionalPercent ?? exists.additional.percent,
        },
        modified: Date.now(),
      };

      const updatedFee = await Fee.findOneAndUpdate(
        { _id: feeId },
        { ...newFeeObj },
        { new: true },
      );

      PaymentLog.create({
        type: 2,
        oldValue: exists,
        newValue: updatedFee,
        adminUserId: user?._id.toString(),
        adminUsername: user?.name || user?.username,
      });

      Base.successResponse(response, Const.responsecodeSucceed, {
        updatedFee: updatedFee.toObject(),
      });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "FeesController, PATCH",
        error,
      });
    }
  },
);

/**
 * @api {delete} /api/v2/admin-page/fees/:id Delete fee flom_v1
 * @apiVersion 2.0.12
 * @apiName  Delete fee flom_v1
 * @apiGroup WebAPI Admin page - Fees
 * @apiDescription  API deletes fee.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1676883195329,
 *     "data": {
 *         "deletedFee": {
 *             "base": {
 *                 "fixed": 0,
 *                 "percent": 0
 *             },
 *             "max": -1,
 *             "additional": {
 *                 "fixed": 0,
 *                 "percent": 0
 *             },
 *             "created": 1676882668962,
 *             "modified": 1676882668962,
 *             "_id": "63f332ec08bf6a341831fccb",
 *             "countryCode": "default",
 *             "paymentMethodType": 1,
 *             "transferType": 0,
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
 * @apiError (Errors) 443772  Fee with given id does not exist
 * @apiError (Errors) 4000007 Token invalid
 */

router.delete(
  "/:id",
  auth({ allowAdmin: true, role: Const.Role.ADMIN }),
  async (request, response) => {
    try {
      const feeId = request.params.id;
      const user = request.user;

      const exists = await Fee.findById(feeId).lean();
      if (!exists) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeFeeDoesNotExist,
          message: `FeesController, DELETE - fee with given id does not exist`,
        });
      }

      const deletedFee = await Fee.findOneAndRemove({
        _id: feeId,
      });

      PaymentLog.create({
        type: 2,
        oldValue: exists,
        newValue: null,
        adminUserId: user?._id.toString(),
        adminUsername: user?.name || user?.username,
      });

      Base.successResponse(response, Const.responsecodeSucceed, {
        deletedFee: deletedFee.toObject(),
      });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "FeesController, DELETE",
        error,
      });
    }
  },
);

function checkParams(inputObj, isUpdate = false) {
  const { countryCode, paymentMethodType, transferType, ...restObj } = inputObj;

  if (!isUpdate) {
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

    if (!Const.paymentMethods.includes(paymentMethodType)) {
      return {
        errorCode: Const.responsecodePaymentMethodNotFound,
        errorMessage: `invalid paymentMethod parameter`,
      };
    }

    if (!Const.transferTypes.includes(transferType)) {
      return {
        errorCode: Const.responsecodeTransferTypeNotFound,
        errorMessage: `invalid transferType parameter`,
      };
    }
  }

  const keys = Object.keys(restObj);
  for (const param of keys) {
    if (typeof restObj[param] !== "number" || (param !== "max" && restObj[param] < 0)) {
      return {
        errorCode: Const.responsecodeInvalidFeeParameter,
        errorMessage: `invalid fee parameter - ${param}`,
        param,
      };
    }
  }

  return {
    countryCode,
    paymentMethodType,
    transferType,
    ...restObj,
  };
}

module.exports = router;
