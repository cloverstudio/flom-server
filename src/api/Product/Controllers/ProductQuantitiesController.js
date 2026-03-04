"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { Product } = require("#models");

/**
 * @api {get} /api/v2/products/quantities Get product quantities flom_v1
 * @apiVersion 2.0.10
 * @apiName Get product quantities flom_v1
 * @apiGroup WebAPI Products
 * @apiDescription New API for getting product quantities
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam (Query string) {String} productIds Product ids, comma separated, for which to get quantity information. Filters out invalid ids.
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1644496754893,
 *   "data": {
 *     "products": [
 *       {
 *         "_id": "5f29451a18f352279ef2a7de",
 *         "itemCount": 14
 *       },
 *       {
 *         "_id": "5f29500c18f352279ef2a7ea",
 *         "itemCount": 1223
 *       },
 *       {
 *         "_id": "61fa7adda93e3f1e9be028b5",
 *         "itemCount": 777
 *       }
 *     ]
 *   }
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
    const { productIds } = request.query;
    const productIdsArray = (productIds || "")
      .split(",")
      .filter((productId) => Utils.isValidObjectId(productId));

    if (productIdsArray.length === 0) {
      return Base.successResponse(response, Const.responsecodeSucceed, { products: [] });
    }

    const productQuantities = await Product.find(
      { _id: { $in: productIdsArray }, isDeleted: false },
      { itemCount: 1 },
    ).lean();

    productQuantities.forEach((product) => delete product.__v);

    Base.successResponse(response, Const.responsecodeSucceed, { products: productQuantities });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "ProductQuantitiesController",
      error,
    });
  }
});

module.exports = router;
