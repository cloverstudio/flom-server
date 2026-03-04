"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { User, ConversionRate, Transfer, Product } = require("#models");

/**
 * @api {get} /api/v2/dashboard/marketplace/search Dashboard - Search dashboard marketplace products
 * @apiName Dashboard - Search marketplace products
 * @apiGroup WebAPI Dashboard
 * @apiDescription API that can be used to serch marketplace products by its name.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam (Query string) {String} [page] Page number for paging (default 1)
 * @apiParam (Query string) {String} [productName] String that represents part of or full product name
 * @apiParam (Query string) {String} [sort] Sort (0-ascending, 1-desceding) - default 1
 *
 * @apiSuccessExample Success-Response:
 * {
 *     "code": 1,
 *     "time": 1658829835713,
 *     "data": {
 *         "products": [
 *             {
 *                 "_id": "62178d0ad1a8ac16c7eb1677",
 *                 "price": 120335.46,
 *                 "created": 1645710602971,
 *                 "file": [
 *                     {
 *                         "file": {
 *                             "originalName": "aJD9ayyALDJDGSFp_1645710.601320.jpg",
 *                             "size": 2598974,
 *                             "mimeType": "image/png",
 *                             "nameOnServer": "pGtQNAZD48xhN7Z3897YdyQEsd0O0pR9"
 *                         },
 *                         "thumb": {
 *                             "originalName": "aJD9ayyALDJDGSFp_1645710.601320.jpg",
 *                             "size": 222000,
 *                             "mimeType": "image/jpeg",
 *                             "nameOnServer": "MVx0a60yvIwlaDJ7k55md8XzqY5HaR8o"
 *                         },
 *                         "_id": "62178d0ad1a8ac16c7eb1678",
 *                         "order": 0,
 *                         "fileType": 0
 *                     }
 *                 ],
 *                 "image": [],
 *                 "location": {
 *                     "type": "Point",
 *                     "coordinates": [
 *                         15.995498,
 *                         45.775759
 *                     ]
 *                 },
 *                 "minPrice": -1,
 *                 "maxPrice": -1,
 *                 "localPrice": {
 *                     "localMin": -1,
 *                     "localMax": -1,
 *                     "localAmount": 50000000,
 *                     "amount": 120335.46,
 *                     "minAmount": -1,
 *                     "maxAmount": -1,
 *                     "currencyCode": "NGN",
 *                     "currencySymbol": "₦",
 *                     "currencyCountryCode": "NG"
 *                 },
 *                 "numberOfLikes": 0,
 *                 "moderation": {
 *                     "status": 3,
 *                     "comment": "Kako dobro!"
 *                 },
 *                 "visibility": "tribes",
 *                 "tribeIds": [
 *                     "6213bb0fd1a8ac16c7eb145e"
 *                 ],
 *                 "categoryId": "5ca458e731780ea12c79f6e0",
 *                 "parentCategoryId": "5ca44d1708f8045e4e3471dd",
 *                 "name": "Sweet floor yeah!",
 *                 "description": "Some floor sweet.",
 *                 "ownerId": "5f87132ffa90652b60469b96",
 *                 "status": 1,
 *                 "itemCount": 10,
 *                 "isNegotiable": false,
 *                 "type": 5,
 *                 "condition": "Damaged",
 *                 "__v": 0,
 *                 "numberOfViews": 34,
 *                 "modified": 1649068260860,
 *                 "sumAmount": 841614.62,
 *                 "localSumAmount": 500034435340
 *             }
 *         ],
 *         "total": 1,
 *         "countResult": 1,
 *         "hasNext": false
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
 **/

router.get("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const token = request.headers["access-token"];
    const page = +request.query.page || 1;
    const productName = request.query.productName || "";
    var sort = request.query.sort || "1"; //default desc

    const user = await User.find({ "token.token": token }).lean();

    if (!user) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeSigninInvalidToken,
        message: "SearchMarketplaceProductsController, invalid user token",
      });
    }

    const date = new Date().toISOString().split("T")[0];
    const conversionRates = await ConversionRate.findOne({
      date: date,
    }).lean();

    const marketplaceProducts = await Transfer.aggregate([
      {
        $match: {
          transferType: Const.transferTypeMarketplace,
          receiverPhoneNumber: user[0].phoneNumber,
          status: Const.transferComplete,
        },
      },
      { $unwind: "$basket" },
      {
        $group: {
          _id: "$basket.id",
          sumAmount: {
            $sum: {
              $multiply: ["$basket.quantity", "$basket.localAmountReceiver.value"],
            },
          },
          satsSumAmount: {
            $sum: {
              $multiply: ["$basket.quantity", "$basket.satsAmount"],
            },
          },
          satsEquivalentLocalAmount: {
            $sum: {
              $cond: [
                { $eq: ["$paymentMethodType", Const.paymentMethodTypeSatsBalance] },
                { $multiply: ["$basket.quantity", "$basket.localAmountReceiver.value"] },
                0,
              ],
            },
          },
          localSumAmount: {
            $sum: { $multiply: ["$basket.quantity", "$basket.localAmountReceiver.value"] },
          },
          currency: {
            $addToSet: "$basket.localAmountReceiver.currency",
          },
        },
      },
    ]);

    var arrayOfProducts = [];

    await Promise.all(
      marketplaceProducts?.map(async (transfer) => {
        var product = await Product.findOne({ _id: transfer._id }).lean();
        product.sumAmount = transfer.sumAmount / conversionRates.rates[transfer.currency[0]];
        product.localSumAmount = transfer.localSumAmount;
        // if (transfer._id.paymentMethodType === Const.paymentMethodTypeSatsBalance) {
        //   product.satsEquivalentLocalAmount = transfer.satsEquivalentLocalAmount;
        //   product.satsSumAmount = transfer.satsSumAmount;
        // }
        arrayOfProducts.push(product);
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
      message: "SearchMarketplaceProductsController",
      error,
    });
  }
});

module.exports = router;
