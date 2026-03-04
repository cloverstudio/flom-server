"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { Product, Category, Transaction } = require("#models");

/**
 * @api {post} /api/v2/product/list/my List Merchant Products
 * @apiVersion 2.0.7
 * @apiName List Merchant Products
 * @apiGroup WebAPI Products
 * @apiDescription API for listing merchant products
 *
 * @apiHeader {String} UUID UUID of the device.
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiParam {String} [productName] productName
 *
 * @apiSuccessExample {json} Success-Response:
 * {
 *   "code": 1,
 *   "time": 1624535998267,
 *   "data": {
 *     "products": [
 *       {
 *         "_id": "5f4f5ab618f352279ef2a82d",
 *         "price": 7.71,
 *         "file": [
 *           {
 *             "file": {
 *               "originalName": "bgdyh xvgf.jpg",
 *               "size": 135599,
 *               "mimeType": "image/png",
 *               "nameOnServer": "M7d1RtmGJ1hLIxK9WNZKleCzDAm3L0NB"
 *             },
 *             "thumb": {
 *               "originalName": "bgdyh xvgf.jpg",
 *               "size": 48000,
 *               "mimeType": "image/jpeg",
 *               "nameOnServer": "VbiHFtsR1K8pjaQl1YUVwCTeHsUJys2L"
 *             },
 *             "_id": "5f4f5ab618f352279ef2a82e",
 *             "order": 0,
 *             "fileType": 0
 *           }
 *         ],
 *         "image": [],
 *         "location": {
 *           "type": "Point",
 *           "coordinates": [
 *             -91.24619849999999,
 *             47.41408209999999
 *           ]
 *         },
 *         "minPrice": -1,
 *         "maxPrice": -1,
 *         "localPrice": {
 *           "localMin": -1,
 *           "localMax": -1,
 *           "localAmount": 3000,
 *           "amount": 7.71,
 *           "minAmount": -1,
 *           "maxAmount": -1,
 *           "currencyCode": "NGN",
 *           "currencySymbol": "₦",
 *           "currencyCountryCode": "234"
 *         },
 *         "productMainCategoryId": "5d88d5551f657c440c4fd914",
 *         "productSubCategoryId": "5d88d5551f657c440c4fd966",
 *         "categoryId": "5ec3ee665ea9301807bd24c8",
 *         "name": "Power Supply for Original Microsoft Xbox AC Adapter Cord Charger Console System",
 *         "description": "Power Supply for Original Microsoft Xbox AC Adapter Cord Charger Console System",
 *         "ownerId": "5f4e5dbb18f352279ef2a7fb",
 *         "created": 1599036086695,
 *         "status": 1,
 *         "itemCount": 5,
 *         "isNegotiable": true,
 *         "condition": "New",
 *         "priceRange": false,
 *         "showYear": false,
 *         "year": 2020,
 *         "__v": 0,
 *         "numberOfViews": 39,
 *         "numberOfLikes": 50,
 *         "moderation": {
 *           "status": 3, // 1 - pending, 2 - rejected, 3 - approved
 *           "comment": ""
 *         },
 *         "score": 0,
 *         "dist": {
 *           "calculated": 10101.309663865966,
 *           "location": {
 *             "type": "Point",
 *             "coordinates": [
 *               -91.24619849999999,
 *               47.41408209999999
 *             ]
 *           }
 *         },
 *         "category": {
 *           "_id": "5ec3ee665ea9301807bd24c8",
 *           "name": "Cables & Cords",
 *           "parentId": "5ec3ee665ea9301807bd24a6",
 *           "__v": 0
 *         },
 *         "numberOfProductsSold": 0
 *       },
 *     ],
 *     "countResult": 26,
 *     "hasNext": false
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 400230 User is not a merchant
 * @apiError (Errors) 4000007 Token not valid
 */

router.post("/", auth({ allowUser: true }), async function (request, response) {
  try {
    // check if user is merchant
    if (
      request.user.typeAcc !== Const.userTypeMerchant &&
      request.user.flow.typeAcc !== Const.userTypeMerchant
    ) {
      return Base.successResponse(response, Const.responsecodeMerchantNotFound);
    }

    const { userRate, userCountryCode, userCurrency, conversionRates } =
      await Utils.getUsersConversionRate({
        user: request.user,
        accessToken: request.headers["access-token"],
      });
    const kidsMode = request.user.kidsMode;

    const productName = request.body.productName;

    let products = {};

    if (!productName) {
      const query = {
        ownerId: request.user._id,
        isDeleted: false,
      };
      if (kidsMode === true) query.appropriateForKids = true;

      products = await Product.find(query)
        .sort({
          created: -1,
        })
        .exec();
    } else {
      const allWords = productName.split(" ");

      let $and = [];
      allWords.forEach((word) => {
        $and.push({
          name: {
            $regex: word,
            $options: "i",
          },
        });
      });
      const query = {
        $and,
        ownerId: request.user._id,
        isDeleted: false,
      };
      if (kidsMode === true) query.appropriateForKids = true;

      products = await Product.find(query)
        .sort({
          created: -1,
        })
        .exec();
    }

    let dataToSend = {};

    //console.log(products);

    let productsToSend = [];
    let categoriesArr = [];
    let productIds = [];

    productsToSend = products.map((product, i) => {
      let obj = product.toObject();

      Utils.addUserPriceToProduct({
        product: obj,
        userRate,
        userCountryCode,
        userCurrency,
        conversionRates,
      });

      let user = request.user;

      const userFields = [
        "_id",
        "name",
        "phoneNumber",
        "avatar",
        "bankAccounts",
        "location",
        "aboutBusiness",
        "businessCategory",
        "workingHours",
        "created",
        "isAppUser",
        "userName",
      ];

      obj.owner = {};

      for (var k in userFields) {
        obj.owner[k] = user[k];
      }

      categoriesArr.push({
        product_id: obj._id,
        categoryId: obj.categoryId,
      });

      productIds.push(obj._id);
      return obj;
    });

    const allTransactions = await Transaction.find({
      completed: true,
      productId: {
        $in: productIds,
      },
    });

    let numberOfProductsSold = {};

    allTransactions.forEach((transaction) => {
      numberOfProductsSold[transaction.productId]
        ? numberOfProductsSold[transaction.productId]++
        : (numberOfProductsSold[transaction.productId] = 1);
    });

    const categoryIds = categoriesArr.map((obj) => obj.categoryId);

    let categories = await Category.find({
      _id: {
        $in: categoryIds,
      },
    });

    categories = categories.map((category) => {
      category = category.toObject();
      return category;
    });

    dataToSend.products = productsToSend.map((obj) => {
      obj.category = categories.find((category) => category._id.toString() == obj.categoryId);
      numberOfProductsSold[obj._id]
        ? (obj.numberOfProductsSold = numberOfProductsSold[obj._id])
        : (obj.numberOfProductsSold = 0);

      return obj;
    });
    //console.log(dataToSend);
    Base.successResponse(response, Const.responsecodeSucceed, dataToSend);
  } catch (e) {
    Base.errorResponse(response, Const.httpCodeServerError, "ListMerchantProductController", e);
    return;
  }
});

module.exports = router;
