"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { Product, Category, Transaction, User, Review, Tribe } = require("#models");
const mongoose = require("mongoose");

/**
 * @api {post} /api/v2/product/list List Products
 * @apiVersion 2.0.7
 * @apiName List Product
 * @apiGroup WebAPI Products
 * @apiDescription List Product
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {String} [location] location - string - "longitude,latitude". API filters by location (100km distance, 200km, all)
 * @apiParam {String} [productName] String to search product name or description (had to leave variable name for backwards compatibility)
 * @apiParam {String} [categoriesIds] categoriesIds string
 * @apiParam {String} [type] product type (1 - video, 2 - video story, 3 - podcast, 4 - text story, 5 - product). Default 5 - product for backward compatibility.
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
 *         "type": 5,
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
 *         "parentCategoryId": "5ec3ee665ea9301807bd24a6",
 *         "parentCategory": {
 *           "_id": "5ec3ee665ea9301807bd24c8",
 *           "name": "Stuff",
 *           "parentId": "-1",
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
 * @apiError (Errors) 4000007 Token not valid
 */

router.post("/", async function (request, response) {
  try {
    const accessToken = request.headers["access-token"];

    const incomingData = {
      searchTerm: request.body.productName,
      categoriesIdsString: request.body.categoriesIds,
      mainCategoryId: request.body.mainCategoryId,
      locationStr: request.body.location,
      page: request.body.page ? Number(request.body.page) : 1,
      kidsMode: true,
    };
    request.body.type ? (incomingData.type = +request.body.type) : (incomingData.type = 5);

    let kidsMode;
    const { userRate, userCountryCode, userCurrency, conversionRates } =
      await Utils.getUsersConversionRate({
        user: request.user,
        accessToken: request.headers["access-token"],
      });

    if (accessToken) {
      const user = await User.findOne({ "token.token": accessToken }).lean();

      if (!user) {
        return Base.successResponse(response, Const.responsecodeSigninInvalidToken);
      }

      kidsMode = user.kidsMode;
      incomingData.blocked = user.blocked || [];
      incomingData.kidsMode = user.kidsMode;

      incomingData.user = {
        _id: user._id.toString(),
        name: user.name,
        phoneNumber: user.phoneNumber,
        avatar: user.avatar,
      };

      const requestUserId = user._id.toString();
      const tribes = await Tribe.find(
        { $or: [{ ownerId: requestUserId }, { "members.accepted.id": requestUserId }] },
        { _id: 1 },
      ).lean();

      incomingData.requestUserTribeIds = tribes.map((tribe) => tribe._id.toString());
    }

    let { products, countResult, hasNext } = await getProducts(incomingData);

    if (products.length == 0) {
      return Base.successResponse(response, Const.responsecodeSucceed, {
        products,
        countResult,
        hasNext,
      });
    }

    const { searchTerm, page, categoriesIdsString, mainCategoryId, blocked = [] } = incomingData;
    const shouldShowFeatured = !searchTerm && !categoriesIdsString && !mainCategoryId && page === 1;

    const featuredProducts = shouldShowFeatured
      ? await Product.find({
          _id: { $in: Config.featuredProductsIds },
          isDeleted: false,
          ownerId: { $nin: blocked },
        }).lean()
      : [];

    const filteredProducts = shouldShowFeatured
      ? products.filter((p) => !Config.featuredProductsIds.includes(p._id.toString()))
      : products;

    const { productsIds, categoriesIds, ownersIds } = getIdsArrays([
      ...featuredProducts,
      ...filteredProducts,
    ]);

    const soldProducts = await getSoldProducts(productsIds);
    const categories = await getCategories(categoriesIds);
    const parentCategories = await getCategories([
      ...new Set(categories.map((category) => category.parentId).filter((id) => id !== "-1")),
    ]);
    const owners = await getOwners(ownersIds);

    const reviews = accessToken ? await getReviews(productsIds, incomingData.user) : null;

    const enrichedProducts = combineData(
      [...featuredProducts, ...filteredProducts],
      [...new Set([...categories, ...parentCategories])],
      owners,
      reviews,
      soldProducts,
    );

    enrichedProducts.forEach((product) => {
      Utils.addUserPriceToProduct({
        product,
        userRate,
        userCountryCode,
        userCurrency,
        conversionRates,
      });
    });

    const outgoingData = {
      products: enrichedProducts,
      countResult,
      hasNext,
    };

    /* if (!incomingData.searchTerm) {
        outgoingData.products = outgoingData.products.sort(
          (a, b) => b.created - a.created
        );
      } */

    Base.successResponse(response, Const.responsecodeSucceed, outgoingData);
  } catch (e) {
    return Base.errorResponse(response, Const.httpCodeServerError, "ListProductController", e);
  }
});

async function generateQuery({
  searchTerm,
  categoriesIds,
  mainCategoryId,
  type,
  userId,
  ownersIds,
  foundProductsIds,
  location,
  requestUserTribeIds,
  kidsMode,
  blocked,
}) {
  let result = { "moderation.status": Const.moderationStatusApproved };

  const blockedUsers = await User.find({ blockedProducts: 1 }, { _id: 1 }).lean();
  const blockedUserIds = blockedUsers.map((user) => user._id.toString());

  result.ownerId = { $nin: [...blockedUserIds, ...blocked] };

  result.isDeleted = false;

  if (userId && blockedUserIds.indexOf(userId) === -1) {
    result.ownerId.$nin.push(userId);
  }

  if (searchTerm && searchTerm !== "") {
    result["$and"] = [
      {
        $or: [
          { name: { $regex: new RegExp(searchTerm.toString()), $options: "i" } },
          { description: { $regex: new RegExp(searchTerm.toString()), $options: "i" } },
        ],
      },
    ];
  }

  if (categoriesIds) {
    result.categoryId = {
      $in: categoriesIds,
    };
  }

  if (mainCategoryId) {
    result.productMainCategoryId = mainCategoryId;
  }

  if (type) {
    result.type = type;
  }

  if (ownersIds) {
    result.ownerId = {
      $in: ownersIds,
    };
  }

  if (foundProductsIds && foundProductsIds.length) {
    result._id = {
      $nin: foundProductsIds,
    };
  }
  if (location) {
    result.location = {
      $near: { $geometry: { type: "Point", coordinates: [location[0], location[1]] } },
    };
  }
  if (requestUserTribeIds?.length > 0) {
    const andQuery = result["$and"] || [];
    result["$and"] = [
      ...andQuery,
      {
        $or: [
          { visibility: Const.productVisibilityPublic },
          { tribeIds: { $in: requestUserTribeIds } },
        ],
      },
    ];
  } else {
    result.visibility = Const.productVisibilityPublic;
  }

  if (kidsMode === true) result.appropriateForKids = true;

  return result;
}

function getLocationFromString(locString) {
  return locString == undefined || locString === ""
    ? Const.defaultLocation
    : locString.split(",").map((str) => Number(str));
}

function getCategoryIdsFromString(catString) {
  return catString == undefined
    ? undefined
    : catString.split(",").map((str) => new mongoose.Types.ObjectId(`${str}`));
}

function addDistField(product, location) {
  return {
    ...product,
    dist: {
      calculated: calculateDistance(location, product.location.coordinates),
      location: product.location,
    },
  };
}

function calculateDistance(loc1, loc2) {
  const lon1 = loc1[0],
    lat1 = loc1[1],
    lon2 = loc2[0],
    lat2 = loc2[1];

  const R = 6371e3; // metres
  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δφ = toRadians(lat2 - lat1);
  const Δλ = toRadians(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const d = R * c; // metres
  const distInKm = d / 1000;

  return distInKm;
}

function toRadians(degrees) {
  var pi = Math.PI;
  return degrees * (pi / 180);
}

function reduceTransactions(acc, curr) {
  acc[curr.productId] = acc[curr.productId] ? acc[curr.productId] + 1 : 1;
  return acc;
}

async function getProducts({
  searchTerm = "",
  categoriesIdsString,
  mainCategoryId,
  type,
  user,
  page,
  locationStr,
  requestUserTribeIds,
  kidsMode,
}) {
  const skip = page > 0 ? (page - 1) * Const.pagingRows : 0;
  const location = getLocationFromString(locationStr);
  const categoriesIds = getCategoryIdsFromString(categoriesIdsString);
  const userId = user ? user._id : null;

  const productQuery = await generateQuery({
    searchTerm,
    categoriesIds,
    mainCategoryId,
    type,
    userId,
    location,
    requestUserTribeIds,
    kidsMode,
  });
  const sort = location ? undefined : { created: "-1" };

  let foundProducts = await Product.find(productQuery)
    .sort(sort)
    .limit(Const.pagingRows)
    .skip(skip)
    .lean();

  const foundProductsIds = foundProducts.map((product) => product._id.toString());

  const needMoreResults =
    foundProducts.length < Const.pagingRows && page === 1 && !categoriesIdsString;

  const numOfResultsNeeded = Const.pagingRows - foundProducts.length;
  const moreResults = needMoreResults
    ? await getMoreResults(numOfResultsNeeded, searchTerm, userId, foundProductsIds)
    : [];

  const searchResults = [...foundProducts, ...moreResults];

  const products = searchResults.map((product) => addDistField(product, location));

  const countResult = await getCountResult(productQuery, searchResults.length);

  async function getCountResult(query, numberOfFoundProducts) {
    const countFromSearchTerm = await getCountFromSearchTerm(query);

    async function getCountFromSearchTerm(query) {
      return Product.countDocuments(query);
    }

    const count =
      countFromSearchTerm < Const.pagingRows ? numberOfFoundProducts : countFromSearchTerm;

    return count;
  }

  const hasNext = page * Const.pagingRows < countResult;

  return { products, countResult, hasNext };
}

async function getMoreResults(count, searchTerm, userId, foundProductsIds) {
  const categoryList = await Category.find(
    { $text: { $search: searchTerm } },
    { score: { $meta: "textScore" } },
  )
    .sort({
      score: { $meta: "textScore" },
    })
    .lean();

  const categoryScoreArr = categoryList.map((category) => category.score);
  const categoryScore = getScore(categoryScoreArr);

  const categoriesIds = categoryList.map((category) => category._id.toString());

  const moreResultsFromCategory = await getProductsByCategoryIds(
    categoriesIds,
    userId,
    count,
    foundProductsIds,
  );

  if (moreResultsFromCategory.length === count) {
    return moreResultsFromCategory;
  }

  const ownerList = await User.find(
    { $text: { $search: searchTerm }, typeAcc: 1, _id: { $ne: userId } },
    { score: { $meta: "textScore" } },
  )
    .sort({
      score: { $meta: "textScore" },
    })
    .lean();

  const ownerScoreArr = ownerList.map((owner) => owner.score);
  const ownerScore = getScore(ownerScoreArr);

  function getScore(arr) {
    return arr.reduce((acc, curr) => acc + curr, 0) / arr.length;
  }

  const ownersIds = ownerList.map((owner) => owner._id.toString());

  const moreResultsFromOwner = await getProductsByOwnerIds(
    ownersIds,
    userId,
    count - moreResultsFromCategory.length,
    foundProductsIds,
  );

  const [firstResults, secondResults] =
    categoryScore > ownerScore
      ? [moreResultsFromCategory, moreResultsFromOwner]
      : [moreResultsFromOwner, moreResultsFromCategory];

  return [...firstResults, ...secondResults];
}

function getIdsArrays(products) {
  const initialReduceObject = {
    productsIds: [],
    categoriesIds: [],
    ownersIds: [],
  };

  return products.reduce(reduceProducts, initialReduceObject);
}

function reduceProducts(acc, product) {
  acc.productsIds.push(product._id.toString());

  const indexOfCategory = acc.categoriesIds.indexOf(product.categoryId.toString());
  if (indexOfCategory < 0) {
    acc.categoriesIds.push(product.categoryId.toString());
  }

  const indexOfOwner = acc.ownersIds.indexOf(product.ownerId);
  if (indexOfOwner < 0) {
    acc.ownersIds.push(product.ownerId);
  }
  return acc;
}

async function getSoldProducts(productsIds) {
  const allTransactions = await Transaction.find({
    completed: true,
    productId: { $in: productsIds },
  }).lean();

  return allTransactions.reduce(reduceTransactions, {});
}

async function getCategories(categoriesIds) {
  const categoryQuery = {
    _id: {
      $in: categoriesIds,
    },
  };

  return Category.find(categoryQuery).lean();
}

async function getProductsByCategoryIds(categoriesIds, userId, count, foundProductsIds) {
  if (categoriesIds.length === 0) {
    return [];
  }
  return Product.find(await generateQuery({ categoriesIds, userId, foundProductsIds }))
    .sort({
      created: -1,
    })
    .limit(count)
    .lean();
}

async function getOwners(ownersIds) {
  const ownerQuery = {
    _id: {
      $in: ownersIds,
    },
  };

  return User.find(ownerQuery).select(Const.userSelectQuery).lean();
}

async function getProductsByOwnerIds(ownersIds, userId, count, foundProductsIds) {
  if (ownersIds.length === 0) {
    return [];
  }
  return Product.find(await generateQuery({ ownersIds, userId, foundProductsIds }))
    .sort({
      created: -1,
    })
    .limit(count)
    .lean();
}

async function getReviews(productsIds, user) {
  const userId = user._id.toString();
  const { name, phoneNumber, avatar } = user;
  const reviewsQuery = {
    product_id: {
      $in: productsIds,
    },
    user_id: userId,
    isDeleted: false,
  };
  const foundReviews = await Review.find(reviewsQuery).lean();
  return foundReviews.map((review) => ({
    ...review,
    name,
    phoneNumber,
    avatar,
  }));
}

function combineData(products, categories, owners, reviews, soldProducts) {
  return products.map((product) =>
    addFieldsToProduct(product, categories, owners, reviews, soldProducts),
  );
}

function addFieldsToProduct(product, categories, owners, reviews, soldProducts) {
  const category = getItemById(product.categoryId, categories);
  const parentCategory = getItemById(product.parentCategoryId, categories);
  const owner = getItemById(product.ownerId, owners);
  const review = reviews ? getItemById(product._id, reviews, "product_id") : null;
  const numberOfProductsSold = getSoldProductsNumber(product._id, soldProducts);
  // const localPrice = product.localPrice || Const.defaultLocalPrice;

  return {
    ...product,
    category,
    parentCategory,
    owner,
    numberOfProductsSold,
    // localPrice,
    ...(review && { review }),
  };
}

function getItemById(id, arr, otherField) {
  const field = otherField ? otherField : "_id";
  return arr.find((item) => item[field].toString() === id.toString());
}

function getSoldProductsNumber(id, soldProducts) {
  return soldProducts[id.toString()] ? soldProducts[id.toString()] : 0;
}

module.exports = router;
