"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { Product, Category, User } = require("#models");

/**
 * @api {get} api/v2/products/editor-choice Editor choice products API
 * @apiVersion 0.0.1
 * @apiName Editor choice products API
 * @apiGroup WebAPI Products
 * @apiDescription API that can be used to fetch the list of featured products.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiSuccessExample {json} Success Response
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
 *               "originalName": "bgd4y2vgf.jpg",
 *               "size": 135599,
 *               "mimeType": "image/png",
 *               "nameOnServer": "M7d1RtmGJ1hLIxK9WNZKleCzDAm3L0NB"
 *               "aspectRatio" : 1.33334,
 *             },
 *             "thumb": {
 *               "originalName": "bgd4y2vgf.jpg",
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
 *         "categoryId": "5ca458e731780ea12c79f6b0",
 *         "name": "Power Supply for Original Microsoft Xbox AC Adapter Cord Charger Console System",
 *         "description": "Power Supply for Original Microsoft Xbox AC Adapter Cord Charger Console System",
 *         "ownerId": "5f4e5dbb18f352279ef2a7fb",
 *         "created": 1599036086695,
 *         "status": 1,
 *         "hashtags": [
 *            "628f295a91a4b060987ff126"
 *         ],
 *         "tags": "auto"
 *         "itemCount": 5,
 *         "isNegotiable": false,
 *         "condition": "New",
 *         "priceRange": false,
 *         "showYear": false,
 *         "year": 2020,
 *         "__v": 0,
 *         "numberOfViews": 39,
 *         "numberOfLikes": 50,
 *         "score": 0,
 *         "owner": {
 *           "_id": "5f7ee464a283bc433d9d722f",
 *           "username": "dragon2",
 *           "phoneNumber": "+2348020000007",
 *           "created": 1602151524372,
 *           "avatar": {
 *             "picture": {
 *               "originalName": "cropped2444207444774310745.jpg",
 *               "size": 4698848,
 *               "mimeType": "image/png",
 *               "nameOnServer": "profile-3XFUoWqVRofEPbMfC1ZKIDNj",
 *               "link": "https://dev.flom.app/api/v2/avatar/user/profile-3XFUoWqVRofEPbMfC1ZKIDNj"
 *             },
 *             "thumbnail": {
 *               "originalName": "cropped2444207444774310745.jpg",
 *               "size": 97900,
 *               "mimeType": "image/png",
 *               "nameOnServer": "thumb-wDIl52eluinZOQ20yNn2PpnMwi",
 *               "link": "https://dev.flom.app/api/v2/avatar/user/thumb-wDIl52eluinZOQ20yNn2PpnMwi"
 *             },
 *           },
 *         },
 *         "isAppUser": true,
 *         "type": 5,
 *         "category": {
 *           "_id": "5ca458e731780ea12c79f6b0",
 *           "name": "Body Care",
 *           "parentId": "5ca44c5b08f8045e4e3471d6",
 *           "group": [
 *             1
 *           ]
 *         },
 *         "parentCategoryId": "5ca44c5b08f8045e4e3471d6",
 *         "parentCategory": {
 *           "_id": "5ca44c5b08f8045e4e3471d6",
 *           "name": "Beauty",
 *           "parentId": "-1",
 *           "group": [
 *             1
 *           ]
 *         },
 *       },
 *     ],
 *     "countResult": 4,
 *     "total": 4
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
    const user = request.user;

    const { userRate, userCountryCode, userCurrency, conversionRates } =
      await Utils.getUsersConversionRate({
        user: request.user,
        accessToken: request.headers["access-token"],
      });
    const kidsMode = user.kidsMode;

    const { products, total, countResult } = await getProducts({
      userRate,
      userCountryCode,
      userCurrency,
      conversionRates,
      kidsMode,
      blocked: user.blocked || [],
    });

    var productsWithOwner = await addOwners(products);

    Base.successResponse(response, Const.responsecodeSucceed, {
      products: productsWithOwner,
      total,
      countResult,
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "GetProductsForYouController",
      error,
    });
  }
});

async function getProducts({
  userRate,
  userCountryCode,
  userCurrency,
  conversionRates,
  kidsMode,
  blocked,
}) {
  const queryForProductsFromUserCountry = {
    "featured.isFeatured": true,
    "featured.countryCode": userCountryCode,
    isDeleted: false,
    ownerId: { $nin: blocked },
  };
  const queryForProductFromDefaultCountry = {
    "featured.isFeatured": true,
    "featured.countryCode": "default",
    isDeleted: false,
    ownerId: { $nin: blocked },
  };
  if (kidsMode === true) {
    queryForProductsFromUserCountry.appropriateForKids = true;
    queryForProductFromDefaultCountry.appropriateForKids = true;
  }

  // const productsFromUserCountry = await Product
  //   .find(queryForProductsFromUserCountry)
  //   .sort({ "featured.created": -1 })
  //   .limit(8)
  //   .lean();

  const productsFromUserCountry = await Product.aggregate([
    { $match: queryForProductsFromUserCountry },
    { $sample: { size: 8 } },
  ]);

  const productsFromDefaultCountry = await Product.aggregate([
    { $match: queryForProductFromDefaultCountry },
    { $sample: { size: 8 - productsFromUserCountry.length } },
  ]);

  const categoryIds = new Set();
  productsFromUserCountry.forEach((product) => {
    categoryIds.add(product.categoryId);
    if (product.parentCategoryId !== "-1") {
      categoryIds.add(product.parentCategoryId);
    }
  });

  productsFromDefaultCountry.forEach((product) => {
    categoryIds.add(product.categoryId);
    if (product.parentCategoryId !== "-1") {
      categoryIds.add(product.parentCategoryId);
    }
  });

  const categories = await Category.find({ _id: { $in: [...categoryIds] } }).lean();

  const categoriesObj = {};
  categories.forEach((category) => {
    const { __v, ...rest } = category;
    categoriesObj[category._id.toString()] = rest;
  });

  productsFromUserCountry.forEach((product) => {
    product._id = product._id.toString();
    product.category = categoriesObj[product.categoryId];
    if (product.parentCategoryId !== "-1") {
      product.parentCategory = categoriesObj[product.parentCategoryId];
    }

    Utils.addUserPriceToProduct({
      product,
      userRate,
      userCountryCode,
      userCurrency,
      conversionRates,
    });
  });

  productsFromDefaultCountry.forEach((product) => {
    product._id = product._id.toString();
    product.category = categoriesObj[product.categoryId];
    if (product.parentCategoryId !== "-1") {
      product.parentCategory = categoriesObj[product.parentCategoryId];
    }

    Utils.addUserPriceToProduct({
      product,
      userRate,
      userCountryCode,
      userCurrency,
      conversionRates,
    });
  });

  const total = productsFromUserCountry.length + productsFromDefaultCountry[0].length;

  return {
    products: [...productsFromUserCountry, ...productsFromDefaultCountry],
    total,
    countResult: productsFromUserCountry.length + productsFromDefaultCountry[0].length,
  };
}

async function addOwners(products) {
  const userIds = products.reduce((acc, cur) => {
    return [...acc, cur.ownerId];
  }, []);
  const users = await User.find({ _id: { $in: [...new Set(userIds)] } }).lean();

  for (let i = 0; i < products.length; i++) {
    const { ownerId } = products[i];

    const currentUser = users.find((user) => user._id.toString() === ownerId);
    if (currentUser) {
      products[i].owner = {
        _id: ownerId,
        username: currentUser.userName,
        phoneNumber: currentUser.phoneNumber,
        name: currentUser.name,
        bankAccounts: currentUser.bankAccounts,
        created: currentUser.created,
        avatar: currentUser.avatar || {},
        isAppUser: currentUser.isAppUser,
        whatsApp: currentUser.whatsApp,
      };
    }
  }
  return products;
}

module.exports = router;
