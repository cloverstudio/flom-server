"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { Category, Product } = require("#models");

/**
 * @api {get} /api/v2/user/products Get users products
 * @apiVersion 2.0.8
 * @apiName Get users products
 * @apiGroup WebAPI User
 * @apiDescription API for getting users (your own) products
 *
 * @apiHeader {String} UUID UUID of the device.
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiParam (Query string) {String} search Search term to find in either product name or description
 * @apiParam (Query string) {String} type Type of products to return (1 - 5)
 * @apiParam (Query string) {String} moderationStatus Moderation status (1 - pending, 2 - rejected, 3 - approved, 5 - drafts)
 * @apiParam (Query string) {String} page Page
 *
 * @apiSuccessExample {json} Success-Response:
 * {
 *   "code": 1,
 *   "time": 1644495256559,
 *   "data": {
 *     "products": [
 *       {
 *         "_id": "6203b59b28981725bde95639",
 *         "price": -1,
 *         "created": 1644410267385,
 *         "file": [
 *           {
 *             "file": {
 *               "originalName": "Video_2_4.mp4",
 *               "nameOnServer": "pcrwnOedOllYUOEnBKoy3NCGBPyAIy50",
 *               "aspectRatio": 1.16364,
 *               "duration": 7.8,
 *               "mimeType": "video/mp4",
 *               "size": 594031,
 *               "hslName": "fFUR5WOzMf2xTIgGnXwKrrkgMbZbj575"
 *             },
 *             "thumb": {
 *               "originalName": "Video_2_4.mp4",
 *               "nameOnServer": "BVSFLyboK3CLgT4gPdcW6YjasVaVgVmG",
 *               "mimeType": "image/png",
 *               "size": 69662
 *             },
 *             "_id": "6203b59b28981725bde9563a",
 *             "fileType": 1,
 *             "order": 0
 *           }
 *         ],
 *         "image": [],
 *         "location": {
 *           "coordinates": [
 *             0,
 *             0
 *           ],
 *           "type": "Point"
 *         },
 *         "minPrice": -1,
 *         "maxPrice": -1,
 *         "localPrice": {
 *           "localMin": -1,
 *           "localMax": -1,
 *           "localAmount": -1,
 *           "amount": -1,
 *           "minAmount": -1,
 *           "maxAmount": -1
 *         },
 *         "numberOfLikes": 0,
 *         "moderation": {
 *           "status": 1
 *         },
 *         "visibility": "public",
 *         "tribeIds": [],
 *         "name": "A Video Category",
 *         "description": "Video for ibes",
 *         "type": 1,
 *         "ownerId": "5f7ee464a283bc433d9d722f",
 *         "parentCategoryId": "5ca44d7208f8045e4e3471e1",
 *         "categoryId": "5ca458e731780ea12c79f6f2",
 *         "parentCategory": {
 *           "_id": "5ca44d7208f8045e4e3471e1",
 *           "name": "Security Services",
 *           "parentId": "-1",
 *           "group": [
 *             1
 *           ]
 *         },
 *         "category": {
 *           "_id": "5ca458e731780ea12c79f6f2",
 *           "name": "Security Fencing",
 *           "parentId": "5ca44d7208f8045e4e3471e1",
 *           "group": [
 *             1
 *           ]
 *         },
 *         "owner": {
 *           "_id": "5f7ee464a283bc433d9d722f",
 *           "username": "mdragic",
 *           "phoneNumber": "+2348020000007",
 *           "created": 1602151524372,
 *           "avatar": {
 *             "picture": {
 *               "originalName": "cropped2444207444774310745.jpg",
 *               "size": 4698848,
 *               "mimeType": "image/png",
 *               "nameOnServer": "profile-3XFUoWqVRofEPbMfC1ZKIDNj"
 *             },
 *             "thumbnail": {
 *               "originalName": "cropped2444207444774310745.jpg",
 *               "size": 97900,
 *               "mimeType": "image/png",
 *               "nameOnServer": "thumb-wDIl52eluinZOQ20yNn2PpnMwi"
 *             }
 *           },
 *           "isAppUser": true
 *         }
 *       }
 *     ],
 *     "total": 1,
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
 * @apiError (Errors) 4000007 Token not valid
 */

router.get("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const userId = user._id.toString();
    const page = +request.query.page || 1;
    const searchQuery = { ownerId: userId };

    const { userRate, userCountryCode, userCurrency, conversionRates } =
      await Utils.getUsersConversionRate({ user, accessToken: request.headers["access-token"] });

    searchQuery.isDeleted = false;

    if (request.query.type) {
      searchQuery.type = +request.query.type;
    }
    if (request.query.moderationStatus) {
      const moderationStatus =
        typeof request.query.moderationStatus === "string"
          ? [request.query.moderationStatus]
          : request.query.moderationStatus;
      moderationStatus.forEach((item) => {
        item = +item;
      });

      searchQuery["moderation.status"] = { $in: moderationStatus };
    }

    if (user.kidsMode) {
      searchQuery.appropriateForKids = true;
    }

    const search = request.query.search;

    if (search && search !== "") {
      searchQuery["$or"] = [
        { name: { $regex: new RegExp(search.toString()), $options: "i" } },
        { description: { $regex: new RegExp(search.toString()), $options: "i" } },
      ];
    }

    const products = await Product.find(searchQuery)
      .sort({ created: -1 })
      .skip((page - 1) * Const.newPagingRows)
      .limit(Const.newPagingRows)
      .lean();

    const total = await Product.find(searchQuery).countDocuments();

    const categoryIds = new Set();

    products.forEach((product) => {
      categoryIds.add(product.categoryId);
      if (product.parentCategoryId !== "-1") {
        categoryIds.add(product.parentCategoryId);
      }
      Utils.addUserPriceToProduct({
        product,
        userRate,
        userCountryCode,
        userCurrency,
        conversionRates,
      });
    });

    const categories = await Category.find({ _id: { $in: [...categoryIds] } }).lean();

    const categoriesObj = {};
    categories.forEach((category) => {
      const { __v, ...rest } = category;
      categoriesObj[category._id.toString()] = rest;
    });

    const owner = {
      _id: userId,
      username: user.userName,
      phoneNumber: user.phoneNumber,
      created: user.created,
      avatar: user.avatar || {},
      isAppUser: user.isAppUser,
    };

    const productsFormatted = products.map((product) => {
      const { _id, __v, ...productExtended } = product;
      if (productExtended.parentCategoryId !== "-1") {
        productExtended.parentCategory = categoriesObj[product.parentCategoryId];
      }
      return {
        _id,
        ...productExtended,
        category: categoriesObj[product.categoryId],
        owner,
      };
    });

    Base.successResponse(response, Const.responsecodeSucceed, {
      products: productsFormatted,
      total,
      hasNext: page * Const.newPagingRows < total,
    });
  } catch (error) {
    Base.errorResponse(
      response,
      Const.httpCodeServerError,
      "RecentlyViewedProductsController",
      error,
    );
  }
});

module.exports = router;
