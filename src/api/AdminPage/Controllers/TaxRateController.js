"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, countries } = require("#config");
const { auth } = require("#middleware");
const { TaxRate, PaymentLog } = require("#models");

/**
 * @api {get} /api/v2/admin-page/tax/:countryCode Get tax rate flom_v1
 * @apiVersion 2.0.12
 * @apiName  Get tax rate flom_v1
 * @apiGroup WebAPI Admin page - Tax Rates
 * @apiDescription  API fetches tax rate.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiSuccessExample Success Response (non-Canadian)
 * {
 *     "code": 1,
 *     "time": 1681281154461,
 *     "data": {
 *         "taxRate": {
 *             "_id": "63eba30ac190243f4e2b2a21",
 *             "countryCode": "ES",
 *             "realModified": 1681222612108,
 *             "realRate": 0.21
 *         }
 *     }
 * }
 *
 * @apiSuccessExample Success Response (Canadian)
 * {
 *     "code": 1,
 *     "time": 1681298599060,
 *     "data": {
 *         "taxRates": {
 *             "countryCode": "CA",
 *             "arrayOfStateTaxes": [
 *                 {
 *                     "stateCode": "AB",
 *                     "realRate": 0.05,
 *                     "realModified": 1676401578753
 *                 },
 *                 {
 *                     "stateCode": "BC",
 *                     "realRate": 0.12,
 *                     "realModified": 1676401578753
 *                 },
 *                 {
 *                     "stateCode": "MB",
 *                     "realRate": 0.12,
 *                     "realModified": 1676401578753
 *                 },
 *                 {
 *                     "stateCode": "NB",
 *                     "realRate": 0.15,
 *                     "realModified": 1676401578753
 *                 }
 *             ]
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
      let taxRate;

      if (countryCode === "CA") {
        const rates = await TaxRate.find({ countryCode }).lean();
        taxRate = {
          countryCode: "CA",
          arrayOfStateTaxes: rates.map((rate) => {
            const { _id, stateCode, realRate, adminRate, realModified, adminModified } = rate;
            return { _id, stateCode, realRate, adminRate, realModified, adminModified };
          }),
        };
      } else {
        taxRate = await TaxRate.findOne({ countryCode }).lean();
      }

      Base.successResponse(response, Const.responsecodeSucceed, {
        taxRate: taxRate ?? {},
      });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "TaxRateController, GET",
        error,
      });
    }
  },
);

/**
 * @api {get} /api/v2/admin-page/tax Get tax rates flom_v1
 * @apiVersion 2.0.12
 * @apiName  Get tax rates flom_v1
 * @apiGroup WebAPI Admin page - Tax Rates
 * @apiDescription  API fetches tax rates.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiParam (Query string) {String} [countryCode]  Country code
 * @apiParam (Query string) {String} [admin]        1 - api will return only those tax rates with an admin rate, anything else - api returns all rates
 *
 * @apiSuccessExample Success Response (non-Canadian)
 * {
 *     "code": 1,
 *     "time": 1681282608696,
 *     "data": {
 *         "taxRates": [
 *             {
 *                 "_id": "63eba30ac190243f4e2b297d",
 *                 "countryCode": "HR",
 *                 "realModified": 1681222612108,
 *                 "realRate": 0.25,
 *                 "adminModified": 1681282584731,
 *                 "adminRate": 0.1
 *             },
 *             {
 *                 "_id": "63eba30ac190243f4e2b29b5",
 *                 "countryCode": "IT",
 *                 "realModified": 1681222612108,
 *                 "realRate": 0.22,
 *                 "adminModified": 1681282595404,
 *                 "adminRate": 0.1
 *             },
 *             {
 *                 "_id": "63eba30ac190243f4e2b2a21",
 *                 "countryCode": "ES",
 *                 "realModified": 1681222612108,
 *                 "realRate": 0.21,
 *                 "adminModified": 1681282591299,
 *                 "adminRate": 0.1
 *             }
 *         ]
 *     }
 * }
 *
 * @apiSuccessExample Success Response (Canadian)
 * {
 *     "code": 1,
 *     "time": 1681298599060,
 *     "data": {
 *         "taxRates": {
 *             "countryCode": "CA",
 *             "arrayOfStateTaxes": [
 *                 {
 *                     "stateCode": "AB",
 *                     "realRate": 0.05,
 *                     "realModified": 1676401578753
 *                 },
 *                 {
 *                     "stateCode": "BC",
 *                     "realRate": 0.12,
 *                     "realModified": 1676401578753
 *                 },
 *                 {
 *                     "stateCode": "MB",
 *                     "realRate": 0.12,
 *                     "realModified": 1676401578753
 *                 },
 *                 {
 *                     "stateCode": "NB",
 *                     "realRate": 0.15,
 *                     "realModified": 1676401578753
 *                 }
 *             ]
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

router.get("/", auth({ allowAdmin: true, role: Const.Role.ADMIN }), async (request, response) => {
  try {
    const { admin, countryCode } = request.query;

    const query = {};
    if (admin === "1") query.adminRate = { $exists: true };
    if (countryCode) query.countryCode = countryCode;

    const rates = await TaxRate.find(query).lean();

    if (!rates.length) {
      return Base.successResponse(response, Const.responsecodeSucceed, { taxRates: [] });
    }

    const arrayOfStateTaxes = [],
      otherRates = [];

    for (const rate of rates) {
      if (rate.countryCode === "CA") {
        const { countryCode, ...rest } = rate;
        arrayOfStateTaxes.push(rest);
      } else {
        otherRates.push(rate);
      }
    }

    const taxRates =
      arrayOfStateTaxes.length > 0
        ? [...otherRates, { countryCode: "CA", arrayOfStateTaxes }]
        : otherRates;
    taxRates.sort((a, b) => a.countryCode - b.countryCode);

    Base.successResponse(response, Const.responsecodeSucceed, { taxRates });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "TaxRateController, GET LIST",
      error,
    });
  }
});

/**
 * @api {patch} /api/v2/admin-page/tax/remove/:countryCode Remove admin tax rate flom_v1
 * @apiVersion 2.0.12
 * @apiName  Remove admin tax rate flom_v1
 * @apiGroup WebAPI Admin page - Tax Rates
 * @apiDescription  API updates tax rate by removing the admin tax rate.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiParam {String} [stateCode]  State code (Canada only)
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1681282527777,
 *     "data": {
 *         "updatedTaxRates": [
 *             {
 *             "_id": "63eba30ac190243f4e2b2a21",
 *             "countryCode": "ES",
 *             "realModified": 1681222612108,
 *             "realRate": 0.21
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
 * @apiError (Errors) 443691  Invalid country code parameter
 * @apiError (Errors) 443800  Missing parameter (stateCode)
 * @apiError (Errors) 443807  Tax rate with given country code does not exist
 * @apiError (Errors) 4000007 Token invalid
 */

router.patch(
  "/remove/:countryCode",
  auth({ allowAdmin: true, role: Const.Role.ADMIN }),
  async (request, response) => {
    try {
      const countryCode = request.params.countryCode;
      const stateCode = request.body.stateCode;
      const user = request.user;

      if (!countries[countryCode]) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidCountryCode,
          message: `TaxRateController, PATCH REMOVE - invalid countryCode parameter`,
        });
      }

      if (countryCode === "CA" && !stateCode) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeMissingParameter,
          message: `TaxRateController, PATCH REMOVE - no stateCode parameter`,
          param: "stateCode",
        });
      }

      const query = { countryCode };
      if (stateCode) query.stateCode = stateCode;

      const exists = await TaxRate.findOne(query).lean();
      if (!exists) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeTaxRateDoesNotExist,
          message: `TaxRateController, PATCH REMOVE - tax rate with given country code does not exist`,
        });
      }
      const oldTax = await TaxRate.findOne(query).lean();

      const newTax = await TaxRate.findOneAndUpdate(
        query,
        { $unset: { adminRate: 1, adminModified: 1 } },
        { new: true },
      );

      PaymentLog.create({
        type: 1,
        oldValue: oldTax,
        newValue: newTax,
        adminUserId: user?._id.toString(),
        adminUsername: user?.name || user?.username,
      });

      Base.successResponse(response, Const.responsecodeSucceed, {
        updatedTaxRates: await getAllRates(),
      });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "TaxRateController, PATCH REMOVE",
        error,
      });
    }
  },
);

/**
 * @api {patch} /api/v2/admin-page/tax/:countryCode Add admin tax rate flom_v1
 * @apiVersion 2.0.12
 * @apiName  Add admin tax rate flom_v1
 * @apiGroup WebAPI Admin page - Tax Rates
 * @apiDescription  API updates tax rate by adding the admin tax rate.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiParam {String} [stateCode]  State code (Canada only)
 * @apiParam {Number} rate         Admin tax rate for country (in form of decimal number e.g. 0.1, NOT 10%) (can't be larger than 1 or lesser than 0)
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1681282150563,
 *     "data": {
 *         "taxRate": {
 *             "_id": "63eba30ac190243f4e2b297d",
 *             "countryCode": "HR",
 *             "realModified": 1681222612108,
 *             "realRate": 0.25,
 *             "adminModified": 1681282150496,
 *             "adminRate": 0.22
 *         }
 *         "allRates": [
 *             {
 *             "_id": "63eba30ac190243f4e2b2a21",
 *             "countryCode": "ES",
 *             "realModified": 1681222612108,
 *             "realRate": 0.21
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
 * @apiError (Errors) 443691  Invalid country code parameter
 * @apiError (Errors) 443800  Missing parameter (rate, stateCode)
 * @apiError (Errors) 443801  Invalid parameter (rate)
 * @apiError (Errors) 443807  Tax rate does not exist
 * @apiError (Errors) 4000007 Token invalid
 */

router.patch(
  "/:countryCode",
  auth({ allowAdmin: true, role: Const.Role.ADMIN }),
  async (request, response) => {
    try {
      const countryCode = request.params.countryCode;
      const { rate, stateCode } = request.body;
      const user = request.user;

      if (!countries[countryCode]) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidCountryCode,
          message: `TaxRateController, PATCH - invalid countryCode parameter`,
        });
      }

      if (countryCode === "CA" && !stateCode) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeMissingParameter,
          message: `TaxRateController, PATCH - no stateCode parameter`,
          param: "stateCode",
        });
      }

      if (!rate) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeMissingParameter,
          message: `TaxRateController, PATCH - no rate parameter`,
          param: "rate",
        });
      }

      if (typeof rate !== "number" || rate > 1 || rate < 0) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidParameter,
          message: `TaxRateController, PATCH - invalid rate parameter`,
          param: "rate",
        });
      }

      const query = { countryCode };
      if (stateCode) query.stateCode = stateCode;

      const exists = await TaxRate.findOne(query).lean();

      if (!exists) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeTaxRateDoesNotExist,
          message: `TaxRateController, PATCH - tax rate does not exist`,
        });
      }

      const newTax = await TaxRate.findOneAndUpdate(
        query,
        { adminRate: rate, adminModified: Date.now() },
        { new: true },
      );

      PaymentLog.create({
        type: 1,
        oldValue: exists,
        newValue: newTax,
        adminUserId: user?._id.toString(),
        adminUsername: user?.name || user?.username,
      });

      Base.successResponse(response, Const.responsecodeSucceed, {
        updatedTaxRates: await getAllRates(),
      });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "TaxRateController, PATCH",
        error,
      });
    }
  },
);

async function getAllRates() {
  const rates = await TaxRate.find().lean();

  const arrayOfStateTaxes = [],
    otherRates = [];

  for (const rate of rates) {
    if (rate.countryCode === "CA") {
      const { countryCode, ...rest } = rate;
      arrayOfStateTaxes.push(rest);
    } else {
      otherRates.push(rate);
    }
  }

  const result = [...otherRates, { countryCode: "CA", arrayOfStateTaxes }];
  result.sort((a, b) => a.countryCode - b.countryCode);

  return result;
}

module.exports = router;
