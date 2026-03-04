"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { User, Product, Transfer, ConversionRate, Message } = require("#models");

/**
 * @api {get} /api/v2/dashboard/marketplace Dashboard - marketplace details API
 * @apiVersion 0.0.1
 * @apiName Dashboard - marketplace details API
 * @apiGroup WebAPI Dashboard
 * @apiDescription API that can be used to fetch marketplace details on dashboard. If paymentMethodType is 5(sats) than satsSumAmount and satsEquivalentLocalAmount will be available.
 *
 * @apiParam (Query string) {String} [page] Page number for paging (default 1)
 * @apiParam (Query string) {String} [sort] Sort (0-ascending, 1-desceding) - default 1
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1658494220577,
 *   "data": {
 *       "products": [
 *
 *           {
 *               "_id": "620fa451fa393b2e0bedf787",
 *               "price": 1929.62,
 *               "created": 1645192276177,
 *               "file": [
 *                   {
 *                       "file": {
 *                           "originalName": "sYqBsPT_TiLINNjb_1645192.001575.mp4",
 *                           "size": 6678104,
 *                           "mimeType": "video/mp4",
 *                           "nameOnServer": "AsQhLyOjnrbIqQhAoCuZmsMv47PG3xN1",
 *                           "hslName": "gSdmNmveSBiQiCGdRp020g9wtqn156Ro",
 *                           "duration": 66.851678
 *                       },
 *                       "thumb": {
 *                           "originalName": "sYqBsPT_TiLINNjb_1645192.001575.mp4",
 *                           "size": 166110,
 *                           "mimeType": "image/png",
 *                           "nameOnServer": "GFHJpSwFIbosTCu8gf4kpyczBidGGFbS"
 *                       },
 *                       "_id": "620fa454fa393b2e0bedf788",
 *                       "order": 0,
 *                       "fileType": 1
 *                   }
 *               ],
 *               "image": [],
 *               "location": {
 *                   "type": "Point",
 *                   "coordinates": [
 *                       15.995498,
 *                       45.775759
 *                   ]
 *               },
 *               "minPrice": -1,
 *               "maxPrice": -1,
 *               "localPrice": {
 *                   "localMin": -1,
 *                   "localMax": -1,
 *                   "localAmount": 800000,
 *                   "amount": 1929.62,
 *                   "minAmount": -1,
 *                   "maxAmount": -1,
 *                   "currencyCode": "NGN",
 *                   "currencySymbol": "₦",
 *                   "currencyCountryCode": "NG"
 *               },
 *               "numberOfLikes": 0,
 *               "moderation": {
 *                   "status": 3,
 *                   "comment": ""
 *               },
 *               "visibility": "public",
 *               "tribeIds": [],
 *               "categoryId": "5ca458e731780ea12c79f6ab",
 *               "parentCategoryId": "5ca44c5b08f8045e4e3471d6",
 *               "name": "A thing",
 *               "description": "I don’t know what I’m selling.",
 *               "ownerId": "5f87132ffa90652b60469b96",
 *               "status": 1,
 *               "itemCount": 4,
 *               "isNegotiable": true,
 *               "type": 5,
 *               "__v": 12,
 *               "numberOfViews": 38,
 *               "modified": 1650032777425,
 *               "sumAmount": 1923.4,
 *               "localSumAmount": 50000,
 *               "satsSumAmount": 22222
 *           },
 *
 *       ],
 *       "reviews": 1,
 *       "views": 4337,
 *       "likes": 11,
 *       "subscribers": 3,
 *       "sold": 2,
 *       "offers": 3,
 *       "total": 3,
 *       "countProductResult": 3,
 *       "hasNext": false
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
    const token = request.headers["access-token"];
    const page = +request.query.page || 1;
    var sort = request.query.sort || "1"; //default desc

    const user = await User.find({ "token.token": token }).lean();

    if (!user) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeSigninInvalidToken,
        message: "GetTotalEarnedController, invalid user token",
      });
    }

    const date = new Date().toISOString().split("T")[0];
    const conversionRates = await ConversionRate.findOne({
      date: date,
    }).lean();

    /*const marketplaceProducts = await Transfer
        .find({
          transferType: Const.transferTypeMarketplace,
          receiverPhoneNumber: user[0].phoneNumber,
        })
        .skip((page - 1) * Const.newPagingRows)
        .limit(Const.newPagingRows)
        .lean();
      */

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
          _id: { basketId: "$basket.id" },
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

    /*const marketplaceProductsSats = await Transfer.aggregate([
          {
            $match: {
              transferType: Const.transferTypeMarketplace,
              receiverPhoneNumber: user[0].phoneNumber,
              status: Const.transferComplete,
              paymentMethodType: Const.paymentMethodTypeSatsBalance,
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
              localSumAmount: {
                $sum: { $multiply: ["$basket.quantity", "$basket.localAmountReceiver.value"] },
              },
              currency: {
                $addToSet: "$basket.localAmountReceiver.currency",
              },
            },
          },
        ]);*/

    var arrayOfProducts = [];

    /*await Promise.all(
          marketplaceProductsSats?.map(async (transfer) => {
            var product = await Product.findOne({ _id: transfer._id }).lean();
            product.sumAmount = transfer.sumAmount / conversionRates.rates[transfer.currency[0]];
            product.localSumAmount = transfer.localSumAmount;

            arrayOfProducts.push(product);
          })
        );

        if (sort == 1) {
          arrayOfProducts.sort((a, b) => {
            return b.sumAmount - a.sumAmount;
          });
        } else {
          arrayOfProducts.sort((a, b) => {
            return a.sumAmount - b.sumAmount;
          });
        }*/

    await Promise.all(
      marketplaceProducts?.map(async (transfer) => {
        var product = await Product.findOne({ _id: transfer._id.basketId }).lean();
        product.sumAmount = transfer.sumAmount / conversionRates.rates[transfer.currency[0]];
        product.localSumAmount = transfer.localSumAmount;
        // if (transfer._id.paymentMethodType === Const.paymentMethodTypeSatsBalance) {
        //   product.satsEquivalentLocalAmount = transfer.satsEquivalentLocalAmount;
        //   product.satsSumAmount = transfer.satsSumAmount;
        // }

        arrayOfProducts.push(product);
      }),
    );

    if (sort == 1) {
      arrayOfProducts.sort((a, b) => {
        return b.sumAmount - a.sumAmount;
      });
    } else {
      arrayOfProducts.sort((a, b) => {
        return a.sumAmount - b.sumAmount;
      });
    }

    const otherInfo = await Product.aggregate([
      {
        $match: { ownerId: user[0]._id.toString() },
      },
      {
        $group: {
          _id: null,
          sumReviews: { $sum: "$numberOfReviews" },
          sumViews: { $sum: "$numberOfViews" },
          sumLikes: { $sum: "$numberOfLikes" },
        },
      },
    ]);

    const subscribers = await User.find({
      followedBusinesses: user[0]._id.toString(),
    }).countDocuments();

    const sold = await Transfer.aggregate([
      {
        $match: {
          status: Const.transferComplete,
          receiverPhoneNumber: user[0].phoneNumber,
        },
      },
      { $unwind: "$basket" },
      { $group: { _id: null, sumSold: { $sum: "$basket.quantity" } } },
    ]);

    const offersCount = await Message.find({
      $and: [
        { type: Const.messageTypeOffer },
        { receiverPhoneNumber: user[0].phoneNumber },
        { "deliveredTo.userId": user[0]._id.toString() },
        { sentTo: user[0]._id.toString() },
      ],
    }).countDocuments();

    const hasNext = page * Const.newPagingRows < arrayOfProducts.length;

    const arrayOfProductsPaging = arrayOfProducts.slice(
      (page - 1) * Const.newPagingRows,
      (page - 1) * Const.newPagingRows + 10,
    );

    Base.successResponse(response, Const.responsecodeSucceed, {
      products: arrayOfProductsPaging,
      reviews: otherInfo[0]?.sumReviews || 0,
      views: otherInfo[0]?.sumViews || 0,
      likes: otherInfo[0]?.sumLikes || 0,
      subscribers: subscribers,
      sold: sold[0]?.sumSold || 0,
      offers: offersCount,
      total: arrayOfProducts.length,
      countProductResult: arrayOfProductsPaging.length,
      hasNext,
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "GetMarketplaceDetailsController",
      error,
    });
  }
});

module.exports = router;
