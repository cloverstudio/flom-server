"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { CreditConversionRate, Transfer, Product } = require("#models");

/**
 * @api {get} /api/v2/dashboard/content/search Dashboard - Search dashboard content products
 * @apiName Dashboard - Search content products
 * @apiGroup WebAPI Dashboard
 * @apiDescription API that can be used to serch content products by its name.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam (Query string) {String} [page] Page number for paging (default 1)
 * @apiParam (Query string) {String} [productName] String that represents part of or full product name
 * @apiParam (Query string) {String} [type] Product type (1-video, 2-video story, 3-podcast, 4-text story). If none is sent, products of all types will be returned.
 * @apiParam (Query string) {String} [sort] Sort (0-ascending, 1-desceding) - default 1
 *
 * @apiSuccessExample Success-Response:
 * {
 *     "code": 1,
 *     "time": 1658831568749,
 *     "data": {
 *        "products": [
 *            {
 *                "_id": "63ff664de3cdd8790e5a3d9b",
 *                "price": -1,
 *                "originalPrice": {
 *                    "value": -1,
 *                    "minValue": -1,
 *                    "maxValue": -1
 *                },
 *                "created": 1677682253335,
 *                "modified": 1677682253335,
 *                "file": [],
 *                "image": [],
 *                "isDeleted": false,
 *                "numberOfReviews": 0,
 *                "location": {
 *                    "coordinates": [
 *                        0,
 *                        0
 *                    ],
 *                    "type": "Point"
 *                },
 *                "minPrice": -1,
 *                "maxPrice": -1,
 *                "localPrice": {
 *                    "localMin": -1,
 *                    "localMax": -1,
 *                    "localAmount": -1,
 *                    "amount": -1,
 *                    "minAmount": -1,
 *                    "maxAmount": -1
 *                },
 *                "numberOfLikes": 0,
 *                "moderation": {
 *                    "status": 3,
 *                    "comment": ""
 *                },
 *                "hashtags": [],
 *                "visibility": "public",
 *                "tribeIds": [],
 *                "communityIds": [],
 *                "featured": {
 *                    "created": 1677682253336,
 *                    "isFeatured": false
 *                },
 *                "allowPublicComments": false,
 *                "name": "tambura",
 *                "description": "{\"paragraphs\":[{\"styles\":[{\"isBold\":false,\"isItalic\":false,\"length\":10,\"fontSize\":16,\"isUnderline\":false,\"start\":0,\"fontColor\":\"#FFFFFF\"}],\"textAlignment\":\"left\",\"backColor\":\"transparent\",\"imageAspectRatio\":0,\"text\":\"privacavav\",\"paragraphType\":\"p\",\"imageScaleSize\":0,\"leftIndentLevel\":0}]}",
 *                "type": 4,
 *                "ownerId": "63e3771e2a439852f927d4a0",
 *                "parentCategoryId": "6227e909dd593844a87918fa",
 *                "categoryId": "6227e92fdd593844a87918fb",
 *                "appropriateForKids": true,
 *                "__v": 0,
 *                "numberOfViews": 2,
 *                "sumAmount": 20,
 *                "localSumAmount": 10000
 *            }
 *       ],
 *      "likes": 4,
 *      "views": 4309,
 *      "reviews": 2,
 *      "blesses": 15
 *      "total": 15,
 *      "countProductResult": 10,
 *      "hasNext": true
 *    }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 4000007 Token not valid
 **/

router.get("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const user = request.user;
    const page = +request.query.page || 1;
    var sort = request.query.sort || "1"; //default desc
    const productName = request.query.productName || "";
    var countryCode = request.query.countryCode;

    if (!countryCode) {
      countryCode = "default";
    }

    var type = request.query.type;

    const creditConversionRate = await CreditConversionRate.findOne({ countryCode }).lean();

    const contentProducts = await Transfer.aggregate([
      {
        $match: {
          transferType: Const.transferTypeSuperBless,
          productId: { $exists: true },
          receiverPhoneNumber: user.phoneNumber,
          status: Const.transferComplete,
          paymentMethodType: {
            $nin: [
              Const.paymentMethodTypeCreditBalance,
              Const.paymentMethodTypeInternal,
              Const.paymentMethodTypeSatsBalance,
            ],
          },
        },
      },
      {
        $group: {
          _id: "$productId",
          sumAmount: { $sum: "$amount" },
          localSumAmount: { $sum: "$localAmountReceiver.value" },
          count: { $sum: 1 },
        },
      },
    ]);

    const contentProductsCredits = await Transfer.aggregate([
      {
        $match: {
          transferType: {
            $in: [
              Const.transferTypeCredits,
              Const.transferTypeSprayBless,
              Const.transferTypeSuperBless,
            ],
          },
          productId: { $exists: true },
          receiverPhoneNumber: user.phoneNumber,
          status: Const.transferComplete,
          paymentMethodType: Const.paymentMethodTypeCreditBalance,
        },
      },
      {
        $group: {
          _id: "$productId",
          creditsSumAmount: { $sum: "$creditsAmount" },
          sumAmount: { $sum: "$creditsAmount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const contentProductsSats = await Transfer.aggregate([
      {
        $match: {
          transferType: Const.transferTypeSuperBless,
          productId: { $exists: true },
          receiverPhoneNumber: user.phoneNumber,
          status: Const.transferComplete,
          paymentMethodType: Const.paymentMethodTypeSatsBalance,
        },
      },
      {
        $group: {
          _id: "$productId",
          sumAmount: { $sum: "$amount" },
          satsSumAmount: { $sum: "$satsAmount" },
          localSumAmount: { $sum: "$localAmountReceiver.value" },
          count: { $sum: 1 },
        },
      },
    ]);

    var arrayOfProducts = [];

    await Promise.all(
      contentProducts?.map(async (transfer) => {
        var product = await Product.findOne({ _id: transfer._id }).lean();
        product.sumAmount = transfer.sumAmount;
        product.localSumAmount = transfer.localSumAmount;

        if (product.type === Number(type)) {
          arrayOfProducts.push(product);
        } else if (!type) {
          arrayOfProducts.push(product);
        }
      }),
    );

    await Promise.all(
      contentProductsCredits?.map(async (transfer) => {
        var product = await Product.findOne({ _id: transfer._id }).lean();
        product.sumAmount = transfer.sumAmount / creditConversionRate.value;
        product.creditsSumAmount = transfer.creditsSumAmount;

        if (product.type === Number(type)) {
          arrayOfProducts.push(product);
        } else if (!type) {
          arrayOfProducts.push(product);
        }
      }),
    );

    await Promise.all(
      contentProductsSats?.map(async (transfer) => {
        var product = await Product.findOne({ _id: transfer._id }).lean();
        product.sumAmount = transfer.sumAmount;
        product.localSumAmount = transfer.localSumAmount;
        product.satsSumAmount = transfer.satsSumAmount;

        if (product.type === Number(type)) {
          arrayOfProducts.push(product);
        } else if (!type) {
          arrayOfProducts.push(product);
        }
      }),
    );

    var arrayOfProductsFiltered = [];

    for (const product of arrayOfProducts) {
      var nameCaseInsensitive = product.name.toLowerCase();
      if (nameCaseInsensitive.includes(productName.toLowerCase())) {
        arrayOfProductsFiltered.push(product);
      }
    }

    if (sort == 1) {
      arrayOfProductsFiltered.sort((a, b) => {
        return b.sumAmount - a.sumAmount;
      });
    } else {
      arrayOfProductsFiltered.sort((a, b) => {
        return a.sumAmount - b.sumAmount;
      });
    }

    const hasNext = page * Const.newPagingRows < arrayOfProductsFiltered.length;

    const arrayOfProductsPaging = arrayOfProductsFiltered.slice(
      (page - 1) * Const.newPagingRows,
      (page - 1) * Const.newPagingRows + 10,
    );

    Base.successResponse(response, Const.responsecodeSucceed, {
      products: arrayOfProductsPaging,
      total: arrayOfProductsFiltered.length,
      countResult: arrayOfProductsPaging.length,
      hasNext,
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "SearchContentProductsController",
      error,
    });
  }
});

module.exports = router;
