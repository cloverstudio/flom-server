"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { User, Product, Category } = require("#models");

/**
 * @api {get} /api/v2/user/products/recent Get recently viewed products
 * @apiVersion 2.0.7
 * @apiName Get recently viewed products
 * @apiGroup WebAPI User
 * @apiDescription API for getting recently viewed products of the user
 *
 * @apiHeader {String} UUID UUID of the device.
 * @apiHeader {String} access-token Users unique access token.
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
 *         "numberOfProductsSold": 0,
 *         "owner": {},
 *       },
 *     ],
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
    const { recentlyViewedProducts = [], kidsMode } = request.user;
    let products = [];
    const newRecentlyViewedProducts = [];

    const { userRate, userCountryCode, userCurrency, conversionRates } =
      await Utils.getUsersConversionRate({
        user: request.user,
        accessToken: request.headers["access-token"],
      });

    var query = {
      _id: { $in: recentlyViewedProducts },
      isDeleted: false,
      "moderation.status": Const.moderationStatusApproved,
    };
    if (kidsMode === true) query.appropriateForKids = true;

    if (recentlyViewedProducts.length) {
      let productsFromDb = await Product.find(query).lean();

      const userIds = productsFromDb.reduce((acc, cur) => {
        return [...acc, cur.ownerId];
      }, []);

      const users = await User.find(
        { _id: { $in: [...new Set(userIds)] } },
        {
          _id: 1,
          bankAccounts: 1,
          location: 1,
          isAppUser: 1,
          name: 1,
          created: 1,
          phoneNumber: 1,
          userName: 1,
          avatar: 1,
        },
      ).lean();

      for (let i = 0; i < recentlyViewedProducts.length; i++) {
        const productId = recentlyViewedProducts[i];
        let product = productsFromDb.find((p) => p._id.toString() === productId);
        if (product) {
          let owner = users.find((u) => u._id.toString() === product.ownerId);
          owner.username = owner.userName;
          delete owner.userName;
          product.owner = owner;
          const category = await Category.findOne({ _id: product.categoryId }).lean();
          product.category = category;

          Utils.addUserPriceToProduct({
            product,
            userRate,
            userCountryCode,
            userCurrency,
            conversionRates,
          });

          products.push(product);
          newRecentlyViewedProducts.push(product._id.toString());
        }
      }
    }

    //handling if product is deleted
    if (recentlyViewedProducts.length !== newRecentlyViewedProducts.length) {
      const user = request.user;
      user.recentlyViewedProducts = newRecentlyViewedProducts;
      await User.findByIdAndUpdate(user._id.toString(), {
        recentlyViewedProducts: newRecentlyViewedProducts,
      });
    }

    Base.successResponse(response, Const.responsecodeSucceed, {
      products,
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

/**
 * @api {post} /api/v2/user/products/recent Add product to recently viewed
 * @apiVersion 2.0.8
 * @apiName Add product to recently viewed
 * @apiGroup WebAPI Products
 * @apiDescription Adds a product to users recently viewed
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {String} [productId] productId
 *
 * @apiSuccessExample Success-Response:
 * {
 *   "code": 1,
 *   "time": 1540989079012,
 *   "data": {
 *     "likedProducts": [
 *       "5cd27ca543ed18722efe6efa"
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
 * @apiError (Errors) 400160 Product not found
 * @apiError (Errors) 400310 No productionId
 * @apiError (Errors) 400600 Product, wrong production Id format
 * @apiError (Errors) 4000007 Token not valid
 */

router.post("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const { productId } = request.body;
    const { user } = request;

    if (!productId) {
      return Base.successResponse(response, Const.responsecodeNoProductId);
    }
    if (!Utils.isValidObjectId(productId)) {
      return Base.successResponse(response, Const.responsecodeProductWrongProductIdFormat);
    }
    const product = await Product.findOne(
      { _id: productId, type: 5, isDeleted: false },
      { _id: 1 },
    ).lean();
    if (!product) {
      return Base.successResponse(response, Const.responsecodeProductNotFound);
    }

    const { recentlyViewedProducts = [] } = user;

    const position = recentlyViewedProducts.indexOf(productId);

    if (position > 0) {
      recentlyViewedProducts.splice(position, 1);
    }
    //if product is not first in the list, add it and save user to db
    if (position !== 0) {
      recentlyViewedProducts.unshift(productId);
      if (recentlyViewedProducts.length > 10) {
        recentlyViewedProducts.pop();
      }
      await User.findByIdAndUpdate(user._id.toString(), { recentlyViewedProducts });
    }

    Base.successResponse(response, Const.responsecodeSucceed, { productAdded: true });
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
