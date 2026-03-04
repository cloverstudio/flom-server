"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { Product, User, Tribe } = require("#models");

/**
 * @api {get} /api/v2/search/products-marketplace Search - Search marketplace products by owner name or product title or description
 * @apiVersion 0.0.1
 * @apiName Search - Search marketplace products by owner name or product title or description
 * @apiGroup WebAPI Search
 * @apiDescription API for text search of marketplace products by owner name or product title or description.
 *
 * @apiParam (Query string) {String} [page] Page number for paging (default 1)
 * @apiParam (Query string) {String} keyword Keyword to search products. If its shorter than 3 characters then API will return empty product array.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1639120215917,
 *   "data": {
 *     "products": [
 *       {
 *         "_id": "61aec9644fba5019a630a1d7",
 *         "price": -1,
 *         "created": 1638844772163,
 *         "file": [
 *           {
 *             "file": {
 *               "originalName": "scaled_IMG_20211123_131655_933.jpg",
 *               "nameOnServer": "ClG2T1A6D8PwFObFhK4PPqijvGpwmQ00",
 *               "size": 2299114,
 *               "mimeType": "image/png",
 *               "aspectRatio": 0.75
 *             },
 *             "thumb": {
 *               "originalName": "scaled_IMG_20211123_131655_933.jpg",
 *               "nameOnServer": "wkt82H6yKth7xPV59Ta1xxH47haR4FGt",
 *               "mimeType": "image/jpeg",
 *               "size": 59400
 *             },
 *             "_id": "61aec9644fba5019a630a1d8",
 *             "fileType": 0,
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
 *           "status": 3,
 *           "comment": ""
 *         },
 *         "name": "once upon a time there was marko",
 *         "description": "flom architecture",
 *         "type": 5,
 *         "ownerId": "60186eab2f92c6229f2299a7",
 *         "categoryId": "5bd98d220bb237660b061159",
 *         "numberOfViews": 4,
 *         "score": 0.6666666666666666,
 *         "visibility": "public"
 *       }
 *     ],
 *     "total": 15,
 *     "countProductResult": 10,
 *     "hasNext": true
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 4000007 Token not valid
 */

router.get("/", auth({ allowUser: true }), async (request, response) => {
  try {
    const keyword = request.query.keyword;
    const page = +request.query.page || 1;

    if (!keyword || keyword.length < 3) {
      return Base.successResponse(response, Const.responsecodeSucceed, {
        products: [],
      });
    }
    const token = request.headers["access-token"];
    var user;

    if (token) {
      user = await User.findOne({
        "token.token": token,
      }).lean();
    }

    var requestUserId, tribes, requestUserTribeIds, requestUserMembershipIds;
    const { userRate, userCountryCode, userCurrency, conversionRates } =
      await Utils.getUsersConversionRate({
        user: request.user,
        accessToken: request.headers["access-token"],
      });

    if (user) {
      requestUserId = user._id.toString();
      tribes = await Tribe.find(
        { $or: [{ ownerId: requestUserId }, { "members.accepted.id": requestUserId }] },
        { _id: 1 },
      ).lean();

      requestUserTribeIds = tribes?.map((tribe) => tribe._id.toString());
      requestUserMembershipIds = user.memberships?.map((membership) => membership.id.toString());

      if (!requestUserMembershipIds) {
        requestUserMembershipIds = [];
      }

      if (!requestUserTribeIds) {
        requestUserTribeIds = [];
      }
    }

    const owners = await User.find({
      name: { $regex: "^" + keyword.toString(), $options: "i" },
      "isDeleted.value": false,
    }).lean();

    const query = {
      $and: [
        {
          isDeleted: false,
          "moderation.status": Const.moderationStatusApproved,
          type: Const.productTypeProduct,
        },
        {
          $or: [
            {
              ownerId: { $in: owners.map((owner) => owner._id.toString()) },
            },
            {
              name: { $regex: "^" + keyword.toString(), $options: "i" },
            },
            {
              description: { $regex: "^" + keyword.toString(), $options: "i" },
            },
          ],
        },
      ],
    };

    if (user.kidsMode === true) {
      query.$and[0].appropriateForKids = true;
    }

    const products = await Product.find(query).lean();

    var productsFiltered = products.filter((product) => {
      if (product.visibility === "tribes") {
        for (let i = 0; i < product.tribeIds?.length; i++) {
          for (let j = 0; j < requestUserTribeIds?.length; j++) {
            if (product.tribeIds[i] === requestUserTribeIds[j]) {
              return true;
            }
          }
        }
        return false;
      }
      return true;
    });

    //removing unnecessary fields from products which are visible only if person is in the community

    var productsToBeReturned = [];

    productsFiltered.every((product) => {
      let shouldFilterFields = true;
      product.communityIds?.forEach((id) => {
        if (requestUserMembershipIds?.includes(id)) {
          shouldFilterFields = false;
        }
      });

      const allowed = [
        "_id",
        "name",
        "numberOfReviews",
        "numberOfLikes",
        "created",
        "numberOfViews",
        "type",
        "communityIds",
        "visibility",
        "image",
        "file",
      ];

      if (product.communityIds?.length > 0 && shouldFilterFields) {
        product = Object.keys(product)
          .filter((key) => allowed.includes(key))
          .reduce((obj, key) => {
            if (key === "image" && product[key] != []) {
              var imageObject = {};
              var arr = [];
              product[key].map((product) => arr.push({ thumb: product.thumb }));
              imageObject = arr;

              obj[key] = imageObject;
            } else if (key === "file" && product[key] != []) {
              var fileObject = {};
              var arr = [];
              product[key].map((product) => arr.push({ thumb: product.thumb }));
              fileObject = arr;

              obj[key] = fileObject;
            } else {
              obj[key] = product[key];
            }
            return obj;
          }, {});
      }

      productsToBeReturned.push(product);
      return true;
    });

    productsFiltered = productsToBeReturned;
    productsFiltered.forEach((product) => {
      Utils.addUserPriceToProduct({
        product,
        userRate,
        userCountryCode,
        userCurrency,
        conversionRates,
      });
    });

    const hasNext = page * Const.newPagingRows < productsFiltered.length;

    const arrayOfProductsPaging = productsFiltered.slice(
      (page - 1) * Const.newPagingRows,
      (page - 1) * Const.newPagingRows + 10,
    );

    Base.successResponse(response, Const.responsecodeSucceed, {
      products: arrayOfProductsPaging,
      total: productsFiltered.length || 0,
      countProductResult: arrayOfProductsPaging.length || 0,
      hasNext,
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "SearchMarketplaceProducts",
      error,
    });
  }
});

module.exports = router;
