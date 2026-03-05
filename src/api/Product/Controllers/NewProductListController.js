"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const } = require("#config");
const Utils = require("#utils");
const { Product, Category, User, Tribe, AdminPageUser, Tag, LiveStream } = require("#models");
const countryIso = require("country-iso");

/**
 * @api {get} /api/v2/products New Product List API
 * @apiVersion 2.0.8
 * @apiName New Product List API
 * @apiGroup WebAPI Products
 * @apiDescription New API that can be used to fetch the list of all products. Default sorting order is from oldest to newest.
 * Users on Admin page need at least Moderator role to access this API. If this API not called from admin page then the results will be additionally
 * filtered so only products that are approved and their owners are not blocked will be returned. API won't return user own products.
 * API will return products that are public and those of the tribes you are part of.
 *
 * @apiHeader {String} access-token Users unique access-token. (Optional)
 *
 * @apiParam (Query string) {String[]} [productIds] Array of product ids to find, each entered separately (?productIds=ID1&productIds=ID2&...)
 * @apiParam (Query string) {String}   [productName] String to search product name or description (had to leave variable name for backwards compatibility)
 * @apiParam (Query string) {String}   [username] Username of the owner of the product
 * @apiParam (Query string) {String}   [userId] userId of the owner of the product. If present then ignores username query
 * @apiParam (Query string) {String}   [tribeId] tribeId of the products that have tribe visibility. Request user has to be part of the tribe
 * @apiParam (Query string) {String}   [type] product type (1 - video, 2 - video story, 3 - podcast, 4 - text story, 5 - product)
 * @apiParam (Query string) {String}   [moderationStatus] Moderation status of the product (1 - pending, 2 - rejected, 3 - approved, 4 - approval needed)
 * @apiParam (Query string) {String}   [countryCode] Country code of the product (e.g. "US", "NG")
 * @apiParam (Query string) {String}   [lat] Location latitude (between -90 and 90)
 * @apiParam (Query string) {String}   [lon] Location longitude (between -180 and 180)
 * @apiParam (Query string) {String}   [sortBy] Sort parameter for product list (modified, created, default: created, if its admin page request default is modified)
 * @apiParam (Query string) {String}   [orderBy] Order parameter for product list (asc or desc, default: desc)
 * @apiParam (Query string) {String}   [page] Page number for paging (default 1)
 * @apiParam (Query string) {String}   [tags] Product tags
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
 * @apiError (Errors) 443220 Username parameter is empty
 * @apiError (Errors) 443221 Wrong moderationStatus parameter
 * @apiError (Errors) 443222 Wrong sortBy parameter
 * @apiError (Errors) 443223 Wrong orderBy parameter
 * @apiError (Errors) 443224 ProductName parameter is empty
 * @apiError (Errors) 443226 Wrong type parameter
 * @apiError (Errors) 443440 Invalid lat parameter
 * @apiError (Errors) 443441 Invalid lon parameter
 * @apiError (Errors) 443488 User not member of the tribe with tribeId
 * @apiError (Errors) 4000007 Token not valid
 */

router.get("/", async function (request, response) {
  try {
    const {
      productName,
      username,
      type,
      moderationStatus,
      countryCode,
      orderBy = "desc",
      page,
      tribeId,
      tags,
    } = request.query;
    let { sortBy = "created" } = request.query;
    const lat = +request.query.lat;
    const lon = +request.query.lon;
    let productIds = request.query.productIds
      ? Array.isArray(request.query.productIds)
        ? request.query.productIds
        : [request.query.productIds]
      : undefined;

    let requestUserId, requestUserTribeIds, requestUserMembershipIds;
    const token = request.headers["access-token"];
    let kidsMode,
      isGuest = true,
      blocked = [];
    const { userRate, userCountryCode, userCurrency, conversionRates } =
      await Utils.getUsersConversionRate({
        user: request.user,
        accessToken: request.headers["access-token"],
      });

    if (token) {
      isGuest = false;

      const { user, code } = await checkTokenAndRole({
        allowUser: true,
        allowAdmin: true,
        role: Const.Role.REVIEWER,
        token,
      });

      const message =
        code === Const.responsecodeSigninInvalidToken ? "Invalid token" : "Unauthorized";
      if (code) {
        return Base.newErrorResponse({
          response,
          code,
          message: `NewProductListController, ${message}`,
        });
      }

      kidsMode = user.kidsMode;
      blocked = user.blocked || [];

      requestUserId = user._id.toString();
      const tribes = await Tribe.find(
        { $or: [{ ownerId: requestUserId }, { "members.accepted.id": requestUserId }] },
        { _id: 1 },
      ).lean();

      requestUserTribeIds = tribes.map((tribe) => tribe._id.toString());
      requestUserMembershipIds = user.memberships?.map((membership) => membership.id.toString());

      if (!requestUserMembershipIds) {
        requestUserMembershipIds = [];
      }

      if (tribeId && requestUserTribeIds.indexOf(tribeId) === -1) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeTribeUserNotMember,
          message: `NewProductListController, user not a member of the tribe`,
        });
      }
    }

    //check if request came from mobile, if it is true that limit the response to only approved products and products with not blocked owners
    const isAdminPageRequest = token?.length === Const.adminPageTokenLength ? true : false;

    let userId = request.query.userId;
    if (userId) {
      const user = await User.findOne({ _id: userId }, { _id: 1 }).lean();
      if (!user) {
        return Base.successResponse(response, Const.responsecodeSucceed, {
          products: [],
          countResult: 0,
          hasNext: false,
        });
      }
    } else if (username !== undefined) {
      if (username === "") {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeUsernameEmpty,
          message: `NewProductListController, username is empty`,
        });
      }

      const user = await User.findOne({ userName: new RegExp(username, "i") }, { _id: 1 }).lean();
      if (!user) {
        return Base.successResponse(response, Const.responsecodeSucceed, {
          products: [],
          countResult: 0,
          total: 0,
          hasNext: false,
        });
      }
      userId = user._id.toString();
    }

    const typesArray = ["1", "2", "3", "4", "5"];
    if (type !== undefined && typesArray.indexOf(type) === -1) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidTypeParameter,
        message: `NewProductListController, wrong type parameter`,
      });
    }

    const moderationStatusArray = ["1", "2", "3", "4"];
    if (moderationStatus !== undefined && moderationStatusArray.indexOf(moderationStatus) === -1) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeWrongModerationStatusParameter,
        message: `NewProductListController, wrong moderationStatus parameter`,
      });
    }

    if (lat && lon) {
      if (lat < -90 || lat > 90) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidLatParameter,
          message: `NewProductListController, invalid lat parameter`,
        });
      }
      if (lon < -180 || lon > 180) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidLonParameter,
          message: `NewProductListController, invalid lon parameter`,
        });
      }
    }

    if (isAdminPageRequest && !request.query.sortBy) {
      sortBy = "modified";
    }
    const sortByArray = ["created", "modified"];
    if (sortBy !== undefined && sortByArray.indexOf(sortBy) === -1) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeWrongSortByParameter,
        message: `NewProductListController, wrong sortBy parameter`,
      });
    }

    const orderByArray = ["asc", "desc"];
    if (orderBy !== undefined && orderByArray.indexOf(orderBy) === -1) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeWrongOrderByParameter,
        message: `NewProductListController, wrong orderBy parameter`,
      });
    }

    //do not use sort if there is lat and lon as results will be sorted by distance
    const sort =
      lat && lon && type === Const.productTypeProduct
        ? undefined
        : { [sortBy]: orderBy === "asc" ? 1 : -1 };

    if (productName !== undefined && productName === "") {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeProductNameEmpty,
        message: `NewProductListController, product name empty`,
      });
    }

    var { productsWithOwner, total, countResult, hasNext } = await getProducts({
      productIds,
      productName,
      userId,
      type: +type,
      moderationStatus: +moderationStatus,
      countryCode,
      lat,
      lon,
      sort,
      page: +page || 1,
      isAdminPageRequest,
      requestUserId,
      requestUserTribeIds,
      requestUserMembershipIds,
      tribeId,
      tags,
      kidsMode,
      isGuest,
      blocked,
    });

    //removing unnecessary fields from products which are visible only if person is in the community
    if (!isAdminPageRequest) {
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

        productsToBeReturned.push(product);
        return true;
      });

      productsWithOwner = productsToBeReturned;
    }

    Base.successResponse(response, Const.responsecodeSucceed, {
      products: productsWithOwner,
      total,
      countResult,
      hasNext,
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "NewProductListController",
      error,
    });
  }
});

async function checkTokenAndRole({
  allowUser = false,
  allowAdmin = false,
  role,
  includedRoles,
  excludedRoles,
  token,
}) {
  let user, diff, tokenObj;
  switch (token.length) {
    case Const.tokenLength:
      if (!allowUser) {
        return { code: Const.responsecodeUnauthorized };
      }
      user = await User.findOne({
        "token.token": token,
      }).lean();

      if (!user) {
        return { code: Const.responsecodeSigninInvalidToken };
      }

      tokenObj = user.token.find(function (tokenObjInAry) {
        return tokenObjInAry.token == token;
      });

      diff = Utils.now() - tokenObj.generateAt;
      if (diff > Const.tokenValidInterval) {
        return { code: Const.responsecodeSigninInvalidToken };
      }
      break;
    case Const.adminPageTokenLength:
      if (!allowAdmin) {
        return { code: Const.responsecodeUnauthorized };
      }
      user = await AdminPageUser.findOne({
        "token.token": token,
      });

      if (!user) {
        return { code: Const.responsecodeSigninInvalidToken };
      }

      diff = Utils.now() - user.token.generatedAt;
      if (diff > Const.adminPageTokenValidInterval) {
        return { code: Const.responsecodeSigninInvalidToken };
      }

      const requestUserRole = user.role;
      if (excludedRoles?.length && excludedRoles.indexOf(requestUserRole) !== -1) {
        return { code: Const.responsecodeUnauthorized };
      }
      if (includedRoles?.length) {
        if (includedRoles.indexOf(requestUserRole) !== -1) {
          request.user = user;
          return next();
        } else {
          return { code: Const.responsecodeUnauthorized };
        }
      }
      if (user.role < role) {
        return { code: Const.responsecodeUnauthorized };
      }
      break;
    default:
      return { code: Const.responsecodeSigninInvalidToken };
  }

  return { user };
}

async function getProducts({
  productIds,
  productName,
  userId,
  type,
  moderationStatus,
  countryCode,
  lat,
  lon,
  sort,
  page = 1,
  isAdminPageRequest,
  requestUserId,
  requestUserTribeIds,
  requestUserMembershipIds,
  tribeId,
  tags,
  kidsMode,
  isGuest,
  blocked,
}) {
  const productQuery = await generateQuery({
    productIds,
    productName,
    userId,
    requestUserId,
    type,
    isAdminPageRequest,
    moderationStatus,
    countryCode,
    lat,
    lon,
    requestUserTribeIds,
    requestUserMembershipIds,
    tribeId,
    tags,
    kidsMode,
    isGuest,
    blocked,
  });

  var products = await Product.find(productQuery).sort(sort).lean();

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

  var productsWithOwner = await addOwners(products);

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

  let paginationDisabled = false;
  if (productIds && Array.isArray(productIds) && productIds.length > 0) {
    productIds = productIds.filter((id) => Utils.isValidObjectId(id));
    paginationDisabled = productIds.length > 0;
  }

  const productsForResponse = paginationDisabled
    ? productsWithOwner
    : productsWithOwner.slice(
        (page - 1) * Const.newPagingRows,
        (page - 1) * Const.newPagingRows + 10,
      );

  const total = productsWithOwner.length;
  const hasNext = paginationDisabled ? false : page * Const.newPagingRows < total;

  return {
    productsWithOwner: productsForResponse,
    total,
    countResult: productsForResponse.length,
    hasNext,
  };
}

async function generateQuery({
  productIds,
  productName,
  userId,
  requestUserId,
  type,
  isAdminPageRequest,
  moderationStatus,
  countryCode,
  lat,
  lon,
  requestUserTribeIds,
  requestUserMembershipIds,
  tribeId,
  tags,
  kidsMode,
  isGuest,
  blocked,
}) {
  const query = { ownerId: { $nin: blocked } };

  let fetchUsersProducts = false;
  if (productIds && Array.isArray(productIds) && productIds.length > 0) {
    productIds = productIds.filter((id) => Utils.isValidObjectId(id));
    query._id = { $in: productIds };
    fetchUsersProducts = true;
  }

  if (kidsMode === true || isGuest === true) query.appropriateForKids = true;

  query.isDeleted = false;

  if (productName) {
    query["$and"] = [
      {
        $or: [
          { name: { $regex: new RegExp(productName.toString()), $options: "i" } },
          { description: { $regex: new RegExp(productName.toString()), $options: "i" } },
        ],
      },
    ];
  }
  if (userId) {
    query.ownerId = userId;
  }
  if (type) {
    query.type = type;
  }
  if (!isAdminPageRequest) {
    query["moderation.status"] = 3;

    const blockedUsers = await User.find({ blockedProducts: 1 }, { _id: 1 }).lean();
    const blockedUserIds = blockedUsers.map((user) => user._id.toString());

    //if userId filter is present and that user is not blocked then skip filtering blocked users and request user products
    if (!userId || (userId && blockedUserIds.indexOf(userId) !== -1)) {
      if (requestUserId && !fetchUsersProducts) {
        blockedUserIds.push(requestUserId);
      }
      query.ownerId.$nin = [...blockedUserIds, ...query.ownerId.$nin];
    }
  } else if (moderationStatus) {
    query["moderation.status"] = moderationStatus;
  } else {
    query["moderation.status"] = { $ne: Const.moderationStatusDraft };
  }
  if (countryCode) {
    const allCreatorIds = await Product.distinct("ownerId");

    const allCreators = await User.find({ _id: { $in: allCreatorIds } }, { phoneNumber: 1 }).lean();

    const groupedByCountryCode = allCreators.reduce((accumulator, current) => {
      const countryCode = Utils.getCountryCodeFromPhoneNumber({ phoneNumber: current.phoneNumber });
      if (!accumulator[countryCode]) {
        accumulator[countryCode] = [current._id.toString()];
      } else {
        accumulator[countryCode].push(current._id.toString());
      }
      return accumulator;
    }, {});
    query.ownerId.$in = groupedByCountryCode[countryCode] || [];
  }
  if (lat && lon && type == Const.productTypeProduct.toString()) {
    query.location = {
      $near: { $geometry: { type: "Point", coordinates: [lon, lat] } },
    };
  }
  const andQuery = query["$and"] || [];
  if (!requestUserId) {
    query["$and"] = [
      ...andQuery,
      {
        $or: [
          { visibility: Const.productVisibilityCommunity },
          { visibility: Const.productVisibilityPublic },
        ],
      },
    ];
  } else if (!isAdminPageRequest) {
    if (tribeId) {
      query["$and"] = [...andQuery, { tribeIds: tribeId }];
    } else if (tribeId || requestUserTribeIds?.length > 0) {
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
  }

  if (tags) {
    var arrayOfTags = tags.split(" ").filter((tag) => tag !== "");

    //remove # before each tag to get only name
    for (let i = 0; i < arrayOfTags.length; i++) {
      if (arrayOfTags[i].startsWith("#")) arrayOfTags[i] = arrayOfTags[i].substring(1);
    }

    var arrayOfTagsIds = [];

    await Promise.all(
      arrayOfTags.map(async (hashtag) => {
        const tag = await Tag.findOne({ name: hashtag });
        const tagObj = tag?.toObject();

        if (tagObj) {
          arrayOfTagsIds.push(tagObj._id.toString());
        } else {
          //pushing hashtag name instead of non existing id, query wont find any products that way
          arrayOfTagsIds.push("#" + hashtag);
        }
      }),
    );

    query.hashtags = { $all: arrayOfTagsIds };
  }
  return query;
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

//Function called to add parent category to every product that doesn't have it
async function addParentCategoryIdToProducts() {
  try {
    const categories = await Category.find({}).lean();
    const categoriesObj = {};
    categories.forEach((category) => {
      const categoryId = category._id.toString();
      if (!categoriesObj[categoryId]) {
        categoriesObj[categoryId] = category;
      }
    });

    const products = await Product.find({});
    const updatedProductsCount = 0;
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      if (!product.parentCategoryId) {
        product.parentCategoryId = categoriesObj[product.categoryId].parentId;
        await product.save();
        updatedProductsCount++;
      }
    }
  } catch (error) {
    logger.error("NewProductListController, addParentCategoryId", error);
  }
}
//addParentCategoryIdToProducts();

module.exports = router;
