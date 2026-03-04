"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { CreditPackage } = require("#models");

/**
 * @api {get} /api/v2/credits Get credit packages flom_v1
 * @apiVersion 2.0.10
 * @apiName  Get credit packages flom_v1
 * @apiGroup WebAPI Credit Package
 * @apiDescription  API fetches credit packages.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1660731589933,
 *     "data": {
 *         "creditPackages": [
 *             {
 *                 "productId": "loremipsumdolorsitamet",
 *                 "values": [
 *                     {
 *                         "countryCode": "HR",
 *                         "value": 200
 *                     }
 *                 ]
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
    const creditPackages = await CreditPackage.find({}).lean();

    const creditPackagesWithPricesForWeb = creditPackages.map((creditPackage) => {
      const values = creditPackage.values.map((value) => {
        const { priceForWeb, ...rest } = value;
        if (!priceForWeb) return { ...rest, priceForWeb: 0 };
        else return value;
      });

      return { ...creditPackage, values };
    });

    Base.successResponse(response, Const.responsecodeSucceed, {
      creditPackages: creditPackagesWithPricesForWeb,
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "CreditPackageController, GET",
      error,
    });
  }
});

/**
 * @api {patch} /api/v2/credits/:id Update credit package flom_v1
 * @apiVersion 2.0.10
 * @apiName  Update credit package flom_v1
 * @apiGroup WebAPI Credit Package
 * @apiDescription  API updates credit package.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiParam {Object[]} values              Array of objects with credit package values per country
 * @apiParam {String}   values.countryCode  Country code for credit value ("default" if this value applies to all countries)
 * @apiParam {Number}   values.value        Number of credits for package and country (-1 if package is to be unavailable in country)
 *
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1660731589933,
 *     "data": {
 *         "creditPackage": {
 *             "productId": "loremipsumdolorsitamet",
 *             "values": [
 *                {
 *                   "countryCode": "HR",
 *                   "value": 200
 *                }
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
 * @apiError (Errors) 443700  No id parameter
 * @apiError (Errors) 4000007 Token invalid
 */

router.patch(
  "/:id",
  auth({ allowAdmin: true, role: Const.Role.ADMIN }),
  async (request, response) => {
    try {
      const packageId = request.params.id;
      const { values } = request.body;

      if (!packageId) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeNoPackageId,
          message: "CreditPackageController, PATCH - no id parameter",
        });
      }

      const updatedPackage = await CreditPackage.findByIdAndUpdate(
        packageId,
        { values },
        {
          new: true,
        },
      );

      Base.successResponse(response, Const.responsecodeSucceed, {
        creditPackage: updatedPackage.toObject(),
      });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "CreditPackageController, PATCH",
        error,
      });
    }
  },
);

/**
 * @api {get} /api/v2/credits/packages Get credit packages for web flom_v1
 * @apiVersion 2.0.10
 * @apiName  Get credit packages for web flom_v1
 * @apiGroup WebAPI Credit Package
 * @apiDescription  API fetches credit packages for web.
 *
 * @apiHeader {String} access-token Users unique access token
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1707477513599,
 *     "data": {
 *         "creditPackages": [
 *             {
 *                 "creditPackageId": "flom_tier_1",
 *                 "credits": 100,
 *                 "priceForWeb": 0,
 *                 "currency": "NGN"
 *             },
 *             {
 *                 "creditPackageId": "flom_tier_2",
 *                 "credits": 200,
 *                 "priceForWeb": 0,
 *                 "currency": "NGN"
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

router.get("/packages", auth({ allowUser: true, allowAdmin: true }), async (request, response) => {
  try {
    const { userRate, userCountryCode, userCurrency } = await Utils.getUsersConversionRate({
      user: request.user,
      accessToken: request.headers["access-token"],
    });

    const creditPackages = await CreditPackage.find({
      "values.countryCode": { $in: ["default", userCountryCode] },
    }).lean();

    const creditPackegesWithPricesForWeb = [];
    for (let creditPackage of creditPackages) {
      let priceForWebLocal;
      let credits;
      let creditPackageId;
      for (let value of creditPackage.values) {
        creditPackageId = creditPackage.productId;

        if (value.countryCode === userCountryCode) {
          if (value.value < 0) {
            credits = null;
            break;
          }

          credits = value.value;
          if (!value.priceForWeb) {
            value.priceForWeb = 0;
            priceForWebLocal = 0;
          } else {
            priceForWebLocal = Utils.roundNumber(userRate * value.priceForWeb, 2);
          }

          break;
        }

        if (value.countryCode === "default") {
          credits = value.value;
          if (!value.priceForWeb) {
            value.priceForWeb = 0;
            priceForWebLocal = 0;
          } else {
            priceForWebLocal = Utils.roundNumber(userRate * value.priceForWeb, 2);
          }
        }
      }
      if (credits)
        creditPackegesWithPricesForWeb.push({
          creditPackageId,
          credits,
          priceForWeb: priceForWebLocal,
          currency: userCurrency,
        });
    }

    Base.successResponse(response, Const.responsecodeSucceed, {
      creditPackages: creditPackegesWithPricesForWeb,
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "CreditPackageController, GET packages for web",
      error,
    });
  }
});

module.exports = router;
