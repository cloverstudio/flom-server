"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { Product, User, Tribe, Category } = require("#models");
const { recombee } = require("#services");

/**
 * @api {get} /api/v2/products/for-you Get products for you v2
 * @apiVersion 2.0.30
 * @apiName Get products for you v2
 * @apiGroup WebAPI Products
 * @apiDescription API that can be used to fetch the list of products which are filtered according user previous actions. Uses Recombee for recommendations. First call of the API should be made with type parameter, subsequent calls should be made with recommId parameter which is returned from the previous call.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam (Query string - first call)       {String} [type]     product type (1 - video, 2 - video story, 3 - podcast, 4 - text story, 5 - product)
 * @apiParam (Query string - subsequent calls) {String} recommId   ID of previous recommendation, for scrolling to next page
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1624535998267,
 *   "data": {
 *     "recommId": "60e8c3a2f1d2c900012f6b8a",
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
 * @apiError (Errors) 4000007 Token not valid
 */

router.get("/", auth({ allowUser: true }), async function (request, response) {
  try {
    let { type, recommId = null } = request.query;

    const user = request.user;
    let userId = user._id.toString();
    const kidsMode = user.kidsMode;
    const blocked = user.blocked || [];
    let userTribeIds, userMembershipIds, userFollowedUsersIds;

    if (!recommId) {
      const typesArray = ["1", "2", "3", "4", "5"];
      if (type !== undefined && typesArray.indexOf(type) === -1) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidTypeParameter,
          message: `GetProductsForYouControllerV2, wrong type parameter`,
        });
      }

      const tribes = await Tribe.find(
        {
          $or: [{ ownerId: user?._id.toString() }, { "members.accepted.id": user?._id.toString() }],
        },
        { _id: 1 },
      ).lean();

      userTribeIds = tribes.map((tribe) => tribe._id.toString());
      userMembershipIds = user.memberships?.map((membership) => membership.id.toString());
      userFollowedUsersIds = user.followedBusinesses || [];

      if (!type || type.length === 0) {
        type = [1, 3, 4, 5];
      } else {
        type = type.split(",").map((t) => parseInt(t));
      }
    }

    const { products, newRecommId } = await getProducts({
      userTribeIds,
      userMembershipIds,
      userFollowedUsersIds,
      type,
      userId,
      user,
      kidsMode,
      blocked,
      recommId,
      userToken: request.headers["access-token"],
    });

    const productsWithOwner = await addOwners(products);

    Base.successResponse(response, Const.responsecodeSucceed, {
      products: productsWithOwner,
      recommId: newRecommId,
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "GetProductsForYouControllerV2",
      error,
    });
  }
});

async function getProducts({
  userId,
  userTribeIds,
  userMembershipIds,
  userFollowedUsersIds,
  type,
  user,
  kidsMode,
  blocked,
  recommId = null,
  userToken,
}) {
  let recombeeResponse;

  if (!recommId) {
    const filter = await generateFilter({
      userId,
      userTribeIds,
      userMembershipIds,
      type,
      kidsMode,
      blocked,
    });

    const booster = await generateBooster({
      user,
      userTribeIds,
      userMembershipIds,
      userFollowedUsersIds,
    });

    recombeeResponse = await recombee.getRecommendations({
      userId,
      count: Const.newPagingRows,
      scenario: "for_you",
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

  const { userRate, userCountryCode, userCurrency, conversionRates } =
    await Utils.getUsersConversionRate({
      user: user,
      accessToken: userToken,
    });

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
    Utils.addUserPriceToProduct({
      product,
      userRate,
      userCountryCode,
      userCurrency,
      conversionRates,
    });
  });

  return { products, newRecommId };
}

async function generateFilter({
  userId,
  userTribeIds,
  userMembershipIds,
  type,
  kidsMode,
  blocked,
}) {
  const typeFilter = type
    ? `('type' in {${type.map((t) => `"${Const.recombeeProductTypesMap[t]}"`).join(", ")}})`
    : null;

  const blockedUsers = await User.find({ blockedProducts: 1 }, { _id: 1 }).lean();
  const blockedUserIds = blockedUsers.map((user) => user._id.toString());
  const blockedIds = [userId, ...blockedUserIds, ...blocked];
  const blockedFilter =
    blockedIds.length > 0
      ? `('ownerId' not in {${blockedIds.map((id) => `"${id}"`).join(", ")}})`
      : null;

  const kidsModeFilter = kidsMode === true ? `('appropriateForKids' == true)` : null;

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
    `('itemType' == "Product")`,
    typeFilter,
    blockedFilter,
    kidsModeFilter,
    visibilityFilter,
  ]
    .filter((q) => q !== null)
    .join(" and ");

  logger.debug(`GetProductsForYouControllerV2, userId: ${userId}, filter: ${filter}`);

  return filter;
}

async function generateBooster({ user, userTribeIds, userMembershipIds, userFollowedUsersIds }) {
  const distanceToUser = `earth_distance('latitude', 'longitude', context_user["latitude"], context_user["longitude"])`;
  const hasValidCoordinates = "'longitude' != 0 and 'latitude' != 0";
  const isInTribeIds = `if 'tribeIds' <= {${userTribeIds
    .map((id) => `"${id}"`)
    .join(", ")}} then 1.2 else 1.0`;
  const isInMembershipIds = `if 'communityIds' <= {${userMembershipIds
    .map((id) => `"${id}"`)
    .join(", ")}} then 1.2 else 1.0`;
  const isFromFollowedUsers = `if 'ownerId' not in {${userFollowedUsersIds
    .map((id) => `"${id}"`)
    .join(", ")}} then 1.2 else 1.0`;

  let booster = `1.0 * (1.0 + 0.1 * size(select(lambda 'x': 'x' in context_user["preferredTags"], 'tags'))) * (1.0 + 0.1 * size(select(lambda 'x': 'x' in context_user["preferredCategories"], 'categories')))`;

  if (
    user.location?.coordinates &&
    user.location.coordinates[0] !== 0 &&
    user.location.coordinates[1] !== 0
  ) {
    booster += ` * (if ${hasValidCoordinates} then (if ${distanceToUser} < 100000 then 1.25 else 1) else (if 'countryCode' == context_user["countryCode"] then 1.25 else 0.75))`;
  } else {
    booster += ` * (if 'countryCode' == context_user["countryCode"] then 1.25 else 0.75)`;
  }
  if (userTribeIds.length > 0) {
    booster += ` * (${isInTribeIds})`;
  }
  if (userMembershipIds.length > 0) {
    booster += ` * (${isInMembershipIds})`;
  }
  if (userFollowedUsersIds.length > 0) {
    booster += ` * (${isFromFollowedUsers})`;
  }

  logger.debug(
    `GetProductsForYouControllerV2, userId: ${user._id.toString()}, booster: ${booster}`,
  );

  return booster;
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
      };
    }
  }
  return products;
}

module.exports = router;
