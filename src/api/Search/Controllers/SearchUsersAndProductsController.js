"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { Product, User, Tribe } = require("#models");

/**
 * @api {get} /api/v2/search/users-and-products Search users and products
 * @apiVersion 2.0.9
 * @apiName Search users and products
 * @apiGroup WebAPI Search
 * @apiDescription API for text search of users and products. Users are searched by: aboutBusiness, businessCategory.name, name and description.
 * Products are searched by name and description. API will search products by text and then filter them by distance. Distance filters are 100 km and
 * 600 km. Distance filter increases if no products are found. If last distance filter still returns no results then distance filter is ignored.
 *
 * @apiParam (Query string) {String} keyword Keyword to search users and products. If its shorter than 3 characters then API will return empty user and product arrays
 * @apiParam (Query string) {String} [productType] Product type
 * @apiParam (Query string) {String} lat Location latitude (between -90 and 90)
 * @apiParam (Query string) {String} lon Location longitude (between -180 and 180)
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
 *         "type": 4,
 *         "ownerId": "60186eab2f92c6229f2299a7",
 *         "categoryId": "5bd98d220bb237660b061159",
 *         "numberOfViews": 4,
 *         "score": 0.6666666666666666,
 *         "owner": {
 *           "_id": "60186eab2f92c6229f2299a7",
 *           "username": "nigerian17",
 *           "phoneNumber": "+2348020000017",
 *           "name": "sinisa 17",
 *           "created": 1612213931971,
 *           "avatar": {
 *             "picture": {
 *               "originalName": "2021-10-14-23-17-53-814.jpg",
 *               "size": 549750,
 *               "mimeType": "image/png",
 *               "nameOnServer": "rjVhDXXaQjVPMIuChdW3J0VPP26fn81F"
 *             },
 *             "thumbnail": {
 *               "originalName": "2021-10-14-23-17-53-814.jpg",
 *               "size": 71000,
 *               "mimeType": "image/png",
 *               "nameOnServer": "8hspyfU1i80KfhofLM0ZPAizVmXo4qPA"
 *             }
 *           },
 *           "isAppUser": true
 *         }
 *       }
 *     ],
 *     "users": [
 *       {
 *         "_id": "5f7ee464a283bc433d9d722f",
 *         "isAppUser": true,
 *         "name": "Marko",
 *         "bankAccounts": [],
 *         "created": 1602151524372,
 *         "phoneNumber": "+2348020000007",
 *         "avatar": {
 *           "picture": {
 *             "originalName": "cropped2444207444774310745.jpg",
 *             "size": 4698848,
 *             "mimeType": "image/png",
 *             "nameOnServer": "profile-3XFUoWqVRofEPbMfC1ZKIDNj"
 *           },
 *           "thumbnail": {
 *             "originalName": "cropped2444207444774310745.jpg",
 *             "size": 97900,
 *             "mimeType": "image/png",
 *             "nameOnServer": "thumb-wDIl52eluinZOQ20yNn2PpnMwi"
 *           }
 *         }
 *       }
 *     ]
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 400121 No product type
 * @apiError (Errors) 443226 Invalid productType parameter (has to be between 1 and 5)
 * @apiError (Errors) 443440 Invalid lat parameter
 * @apiError (Errors) 443441 Invalid lon parameter
 */

router.get("/", async (request, response) => {
  try {
    const { keyword } = request.query;
    const productType = +request.query.productType || undefined;
    const lat = +request.query.lat;
    const lon = +request.query.lon;

    if (!keyword || keyword.length < 3) {
      return Base.successResponse(response, Const.responsecodeSucceed, {
        products: [],
        users: [],
      });
    }
    /*
      if (!productType) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeProductNoType,
          message: `UserAndProductController, no product type`,
        });
      }
      
      if (Const.productTypes.indexOf(productType) === -1) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidTypeParameter,
          message: `UserAndProductController, wrong type parameter`,
        });
      }
      */
    if ((!lat && lat !== 0) || lat < -90 || lat > 90) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidLatParameter,
        message: `UserAndProductController, invalid lat parameter`,
      });
    }
    if ((!lon && lon !== 0) || lon < -180 || lon > 180) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidLonParameter,
        message: `UserAndProductController, invalid lon parameter`,
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

    const query = {};
    query.isDeleted = false;

    query["moderation.status"] = Const.moderationStatusApproved;

    if (!user || (user && user.kidsMode)) {
      query.appropriateForKids = true;
    }

    if (productType) {
      query.type = productType;
    } else {
      query.type = {
        $in: [
          Const.productTypeVideo,
          Const.productTypeVideoStory,
          Const.productTypePodcast,
          Const.productTypeTextStory,
          Const.productTypeProduct,
        ],
      };
    }

    query.location = {
      $near: { $geometry: { type: "Point", coordinates: [lon, lat] } },
    };

    var andQuery = query["$and"] || [];
    query["$and"] = [
      ...andQuery,
      {
        $or: [
          { name: { $regex: new RegExp(keyword.toString()), $options: "i" } },
          { tags: { $regex: new RegExp(keyword.toString()), $options: "i" } },
          { description: { $regex: new RegExp(keyword.toString()), $options: "i" } },
        ],
      },
    ];
    andQuery = query["$and"];
    if (requestUserTribeIds?.length > 0) {
      query["$and"] = [
        ...andQuery,
        {
          $or: [
            { visibility: Const.productVisibilityPublic },
            { tribeIds: { $in: requestUserTribeIds } },
            { visibility: Const.productVisibilityCommunity },
          ],
        },
      ];
    } else if (requestUserMembershipIds?.length > 0) {
      query["$and"] = [
        ...andQuery,
        {
          $or: [
            { visibility: Const.productVisibilityPublic },
            { visibility: Const.productVisibilityCommunity },
          ],
        },
      ];
    } else {
      query["$and"] = [
        ...andQuery,
        {
          $or: [
            { visibility: Const.productVisibilityCommunity },
            { visibility: Const.productVisibilityPublic },
          ],
        },
      ];
    }

    //console.log(query.$and[0]);
    /*
      const searchQuery = {
        $or: [
          { name: { $regex: new RegExp(keyword.toString()), $options: "i" } },
          { description: { $regex: new RegExp(keyword.toString()), $options: "i" } },
        ],
        type: productType,
        location: {
          $near: { $geometry: { type: "Point", coordinates: [lon, lat] } },
        },
      };
      */

    const products = await Product.find(query).lean();

    products.forEach((product) => {
      delete product.__v;

      Utils.addUserPriceToProduct({
        product,
        userRate,
        userCountryCode,
        userCurrency,
        conversionRates,
      });
    });

    var productsWithOwner = await addOwners(products);

    //removing unnecessary fields from products which are visible only if person is in the community
    if (requestUserMembershipIds?.length > 0 || !user) {
      var productsToBeReturned = [];

      productsWithOwner.every((product) => {
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
          "owner",
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
                let imageObject = {};
                let arr = [];
                product[key].map((product) => arr.push({ thumb: product.thumb }));
                imageObject = arr;

                obj[key] = imageObject;
              } else if (key === "file" && product[key] != []) {
                let fileObject = {};
                let arr = [];
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

      productsWithOwner = productsToBeReturned;
    }

    const users = await User.find(
      {
        name: { $regex: new RegExp(keyword.toString()), $options: "i" },
        $or: [{ isCreator: true }, { isSeller: true }],
        "isDeleted.value": false,
      },
      {
        _id: 1,
        userName: 1,
        phoneNumber: 1,
        name: 1,
        created: 1,
        avatar: 1,
        isAppUser: 1,
      },
    )
      .sort({ created: -1 })
      .lean();
    users.forEach((user) => delete user.__v);

    Base.successResponse(response, Const.responsecodeSucceed, {
      products: productsWithOwner,
      users,
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "UserAndProductController",
      error,
    });
  }
});

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
      };
    }
  }
  return products;
}

module.exports = router;
