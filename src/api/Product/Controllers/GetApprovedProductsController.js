"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, Config } = require("#config");
const { Product } = require("#models");

/**
 * @api {get} /api/v2/products/approved/total Get approved products total flom_v1
 * @apiVersion 2.0.25
 * @apiName Get approved products total
 * @apiGroup WebAPI Products
 * @apiDescription This API should be used to fetch the total count of approved products.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiSuccessExample {json} Success Response
 * {
 *     "code": 1,
 *     "time": 1696940149399,
 *     "data": {
 *         "approvedProductsTotal": 22
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

router.get("/total", async function (request, response) {
  try {
    const token = request.headers["access-token"];

    if (token !== Config.guestToken) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeSigninInvalidToken,
        message: "GetApprovedProductsTotalController, invalid token",
      });
    }

    const approvedProductsTotal = await Product.countDocuments({
      "moderation.status": 3,
      isDeleted: false,
      appropriateForKids: true,
      visibility: "public",
    });

    Base.successResponse(response, Const.responsecodeSucceed, { approvedProductsTotal });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "GetApprovedProductsTotalController",
      error,
    });
  }
});

/**
 * @api {get} /api/v2/products/approved Get approved products flom_v1
 * @apiVersion 2.0.14
 * @apiName Get approved products
 * @apiGroup WebAPI Products
 * @apiDescription This API should be used to fetch the list of approved products.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam (Query string) {String} [page] Page
 *
 * @apiSuccessExample {json} Success Response
 * {
 *     "code": 1,
 *     "time": 1696940149399,
 *     "data": {
 *         "hasNext": false,
 *         "approvedProducts": [
 *             {
 *                 "_id": "63dcf50ec30542684f1b7b7c",
 *                 "name": "Mouse",
 *                 "lastModified": 1675425038102,
 *                 "created": 1675425038102,
 *                 "type": 2
 *             },
 *             {
 *                 "_id": "63dcfee0c30542684f1b7b98",
 *                 "name": "USB c to jack",
 *                 "lastModified": 1675427552944,
 *                 "created": 1675427552944.
 *                 "type": 2
 *             },
 *             {
 *                 "_id": "63e0b00aa62453346de15dbf",
 *                 "name": "Test1",
 *                 "lastModified": 1675669514514,
 *                 "created": 1675669514514,
 *                 "type": 2
 *             },
 *             {
 *                 "_id": "63e0b046a62453346de15dc1",
 *                 "name": "Kibord",
 *                 "lastModified": 1675669574742,
 *                 "created": 1675669574742,
 *                 "type": 2
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

router.get("/", async function (request, response) {
  try {
    const token = request.headers["access-token"];

    if (token !== Config.guestToken) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeSigninInvalidToken,
        message: "GetApprovedProductsController, invalid token",
      });
    }

    const limit = 50_000;
    const page = request.query.page ? +request.query.page : 1;
    const skip = page > 0 ? (page - 1) * limit : 0;

    const products = await Product.find(
      {
        "moderation.status": 3,
        isDeleted: false,
        appropriateForKids: true,
        visibility: "public",
      },
      {
        name: 1,
        modified: 1,
        created: 1,
        type: 1,
      },
    )
      .limit(limit)
      .skip(skip)
      .lean();

    const approvedProducts = products.map((product) => {
      return {
        _id: product._id.toString(),
        name: product.name,
        lastModified: product.modified ?? product.created,
        created: product.created,
        type: product.type,
      };
    });

    const countResult = await Product.countDocuments({
      "moderation.status": 3,
      isDeleted: false,
      appropriateForKids: true,
      visibility: "public",
    });
    const hasNext = countResult > skip + limit;

    Base.successResponse(response, Const.responsecodeSucceed, {
      approvedProducts,
      hasNext,
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "GetApprovedProductsController",
      error,
    });
  }
});

module.exports = router;
