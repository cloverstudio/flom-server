"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { Product, Category, User, Tribe, Tag, LiveStream } = require("#models");
const { recombee } = require("#services");
const countryIso = require("country-iso");

/**
 * @api {get} /api/v2/products/recommended Get Recommended Products
 * @apiVersion 2.0.30
 * @apiName Get Recommended Products
 * @apiGroup WebAPI Products
 * @apiDescription Fetches list of products recommended by recombee.
 *
 * @apiHeader {String} access-token Users unique access-token. (Optional)
 *
 * @apiParam (Query string) {String}   [type] product type (1 - video, 2 - video story, 3 - podcast, 4 - text story, 5 - product)
 * @apiParam (Query string) {String}   [countryCode] country code
 * @apiParam (Query string) {String}   [lat] Location latitude (between -90 and 90)
 * @apiParam (Query string) {String}   [lon] Location longitude (between -180 and 180)
 * @apiParam (Query string) {String}   [recommId] Recombee recommendation id
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1624535998267,
 *   "data": {
 *     "recommId": "some-recommendation-id",
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
 *               "width": 352,
 *               "height": 640,
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
 *     "countResult": 6,
 *     "total": 26,
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
 * @apiError (Errors) 443226 Wrong type parameter
 * @apiError (Errors) 443440 Invalid lat parameter
 * @apiError (Errors) 443441 Invalid lon parameter
 * @apiError (Errors) 4000007 Token not valid
 */

router.get("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const { type, recommId = null, countryCode } = request.query;
    const lat = +request.query.lat;
    const lon = +request.query.lon;
    const user = request.user;

    let userId, userTribeIds, userMembershipIds;
    const kidsMode = user.kidsMode;
    const blocked = user.blocked || [];
    const { userRate, userCountryCode, userCurrency, conversionRates } =
      await Utils.getUsersConversionRate({
        user: request.user,
        accessToken: request.headers["access-token"],
      });

    userId = user._id.toString();
    const tribes = await Tribe.find(
      { $or: [{ ownerId: userId }, { "members.accepted.id": userId }] },
      { _id: 1 },
    ).lean();

    userTribeIds = tribes.map((tribe) => tribe._id.toString());
    userMembershipIds = user.memberships?.map((membership) => membership.id.toString());

    if (!userMembershipIds) {
      userMembershipIds = [];
    }

    const typesArray = ["1", "2", "3", "4", "5"];
    if (type !== undefined && typesArray.indexOf(type) === -1) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidTypeParameter,
        message: `GetRecommendedProductsController, wrong type parameter`,
      });
    }

    if (lat && lon) {
      if (lat < -90 || lat > 90) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidLatParameter,
          message: `GetRecommendedProductsController, invalid lat parameter`,
        });
      }
      if (lon < -180 || lon > 180) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidLonParameter,
          message: `GetRecommendedProductsController, invalid lon parameter`,
        });
      }
    }

    const { productsWithOwner, newRecommId } = await getProducts({
      user,
      type: +type,
      lat,
      lon,
      countryCode,
      userId,
      userTribeIds,
      userMembershipIds,
      kidsMode,
      blocked,
      recommId,
    });

    productsWithOwner.every((product) => {
      let shouldFilterFields = true;
      product.communityIds?.forEach((id) => {
        if (userMembershipIds?.includes(id)) {
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

      Utils.addUserPriceToProduct({
        product,
        userRate,
        userCountryCode,
        userCurrency,
        conversionRates,
      });

      return true;
    });

    Base.successResponse(response, Const.responsecodeSucceed, {
      products: productsWithOwner,
      recommId: newRecommId,
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "GetRecommendedProductsController",
      error,
    });
  }
});

async function getProducts({
  user,
  userTribeIds,
  userMembershipIds,
  type,
  lat,
  lon,
  countryCode,
  kidsMode,
  blocked,
  recommId,
}) {
  const userId = user._id.toString();
  let recombeeResponse;

  if (!recommId) {
    const scenarioMap = {
      1: "video",
      2: "expo",
      3: "audio",
      4: "text",
      5: "market",
    };

    const filter = await generateFilter({
      userId,
      userTribeIds,
      userMembershipIds,
      type,
      kidsMode,
      blocked,
    });

    const booster = await generateBooster({ user, type, countryCode, lat, lon });

    recombeeResponse = await recombee.getRecommendations({
      userId,
      count: Const.newPagingRows,
      scenario: scenarioMap[type],
      filter,
      booster,
    });
  } else {
    recombeeResponse = await recombee.getNextRecommendations({
      recommId,
      count: Const.newPagingRows,
    });
  }

  const recommendedProductIds = recombeeResponse.recomms.map((item) => item.id.replace("p_", ""));
  const newRecommId = recombeeResponse.recommId;

  const products = await Product.find({ _id: { $in: recommendedProductIds } })
    .sort({ created: -1 })
    .lean();

  const categoryIds = new Set();
  products.forEach((product) => {
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

  products.forEach((product) => {
    product._id = product._id.toString();
    product.category = categoriesObj[product.categoryId];
    if (product.parentCategoryId !== "-1") {
      product.parentCategory = categoriesObj[product.parentCategoryId];
    }
  });

  let productsWithOwner = await addOwners(products);

  if (lat && lon && type == Const.productTypeProduct.toString()) {
    const userLocation = countryIso.get(lat, lon);

    productsWithOwner = productsWithOwner.filter((product) => {
      const productCountry = countryIso.get(
        product.location.coordinates[1],
        product.location.coordinates[0],
      );
      if (userLocation.some((country) => productCountry.includes(country))) {
        return true;
      }
      if (product.owner?.internationalUser) {
        return true;
      }
      return false;
    });
  }

  return { productsWithOwner, newRecommId };
}

async function generateFilter({
  userId,
  type,
  userTribeIds,
  userMembershipIds,
  kidsMode,
  blocked,
}) {
  const typeFilter = type ? `'type' == "${Const.recombeeProductTypesMap[type]}"` : null;

  const blockedUsers = await User.find({ blockedProducts: 1 }, { _id: 1 }).lean();
  const blockedUserIds = blockedUsers.map((user) => user._id.toString());
  const blockedIds = [userId, ...blockedUserIds, ...blocked];
  const blockedFilter =
    blockedIds.length > 0
      ? `'ownerId' not in {${blockedIds.map((id) => `"${id}"`).join(", ")}}`
      : null;

  const kidsModeFilter = kidsMode === true ? `'appropriateForKids' == true` : null;

  let visibilityFilter = null;
  if (userTribeIds?.length > 0 && userMembershipIds?.length > 0) {
    visibilityFilter = `'visibility' == "${
      Const.productVisibilityPublic
    }" or 'tribeIds' <= {${userTribeIds
      .map((id) => `"${id}"`)
      .join(", ")}} or 'communityIds' <= {${userMembershipIds.map((id) => `"${id}"`).join(", ")}}`;
  } else if (userMembershipIds?.length > 0) {
    visibilityFilter = `'visibility' == "${
      Const.productVisibilityPublic
    }" or 'communityIds' <= {${userMembershipIds.map((id) => `"${id}"`).join(", ")}}`;
  } else if (userTribeIds?.length > 0) {
    visibilityFilter = `'visibility' == "${
      Const.productVisibilityPublic
    }" or 'tribeIds' <= {${userTribeIds.map((id) => `"${id}"`).join(", ")}}`;
  } else {
    visibilityFilter = `'visibility' == "${Const.productVisibilityPublic}"`;
  }
  visibilityFilter = `(${visibilityFilter})`;

  const filter = [
    `'itemType' == "Product"`,
    typeFilter,
    blockedFilter,
    kidsModeFilter,
    visibilityFilter,
  ]
    .filter((q) => q !== null)
    .join(" and ");

  logger.debug(`GetRecommendedProductsController, userId: ${userId}, filter: ${filter}`);

  return filter;
}

async function generateBooster({ user, type, countryCode, lat, lon }) {
  const distanceToUser = lat
    ? `earth_distance('latitude', 'longitude', ${lat}, ${lon})`
    : `earth_distance('latitude', 'longitude', context_user["latitude"], context_user["longitude"])`;
  const hasValidCoordinates = "'longitude' != 0 and 'latitude' != 0";

  let booster = null;

  switch (type) {
    case Const.productTypePodcast:
    case Const.productTypeTextStory:
      booster = `if 'language' != null and 'language' in context_user["languages"] then 1.25 else 1.0`;
      break;
    case Const.productTypeProduct:
      if (
        user.location?.coordinates &&
        user.location.coordinates[0] !== 0 &&
        user.location.coordinates[1] !== 0
      ) {
        booster = countryCode
          ? `if ${hasValidCoordinates} then (if ${distanceToUser} < 100000 then 1.25 else 1) else (if 'countryCode' == "${countryCode}" then 1.25 else 0.75)`
          : `if ${hasValidCoordinates} then (if ${distanceToUser} < 100000 then 1.25 else 1) else (if 'countryCode' == context_user["countryCode"] then 1.25 else 0.75)`;
      } else {
        booster = countryCode
          ? `if 'countryCode' == "${countryCode}" then 1.25 else 0.75`
          : `if 'countryCode' == context_user["countryCode"] then 1.25 else 0.75`;
      }
      break;
    case Const.productTypeVideo:
    case Const.productTypeVideoStory:
    default:
      booster = null;
      break;
  }

  logger.debug(
    `GetRecommendedProductsController, userId: ${user._id.toString()}, booster: ${booster}`,
  );

  return booster;
}

async function addOwners(products) {
  const start = Date.now();

  const ownerIds = products.reduce((acc, cur) => {
    return [...acc, cur.ownerId];
  }, []);

  const owners = await User.find({ _id: { $in: [...new Set(ownerIds)] } }).lean();
  const ownerLiveStreams = await LiveStream.find({
    isActive: true,
    userId: { $in: ownerIds },
  }).lean();

  for (let i = 0; i < products.length; i++) {
    const { ownerId } = products[i];

    const currentUser = owners.find((user) => user._id.toString() === ownerId);

    if (currentUser) {
      const activeLiveStream = ownerLiveStreams.find((stream) => stream.userId === ownerId);

      products[i].owner = {
        _id: ownerId,
        username: currentUser.userName,
        phoneNumber: currentUser.phoneNumber,
        name: currentUser.name,
        bankAccounts: currentUser.bankAccounts,
        created: currentUser.created,
        avatar: currentUser.avatar || {},
        isAppUser: currentUser.isAppUser,
        internationalUser: currentUser.internationalUser,
        activeLiveStream,
      };
    }
  }

  return products;
}

module.exports = router;
