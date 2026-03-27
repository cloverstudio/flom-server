"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { Product, User, Tribe, Category } = require("#models");

/**
 * @api {post} /api/v2/product/similar Get Similar Products
 * @apiName Get Similar Products
 * @apiGroup WebAPI Products
 * @apiDescription Get Similar Products
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {String} productId productId
 *
 * @apiSuccessExample Success-Response:
 * {
 *     "code": 1,
 *     "time": 1656592590212,
 *     "data": {
 *         "similarProducts": [
 *             {
 *                 "price": 143.31,
 *                 "created": 1595245668351,
 *                 "modified": 1595245668351,
 *                 "file": [
 *                     {
 *                         "file": {
 *                             "originalName": "HyperX - CloudX Flight Wireless Stereo Gaming Headset - Black.jpg",
 *                             "size": 1076095,
 *                             "mimeType": "image/png",
 *                             "nameOnServer": "8ISQCEGzcRhz9htTy2HYjyMStqzAQkpe"
 *                         },
 *                         "thumb": {
 *                             "originalName": "HyperX - CloudX Flight Wireless Stereo Gaming Headset - Black.jpg",
 *                             "size": 59900,
 *                             "mimeType": "image/jpeg",
 *                             "nameOnServer": "hrUQFHZmOCmE4JsvmZsy8VOS2CskPwfD"
 *                         },
 *                         "_id": "5f195ff97e2d846a457cce6b",
 *                         "order": 0,
 *                         "fileType": 0
 *                     }
 *                 ],
 *                 "image": [],
 *                 "location": {
 *                     "coordinates": [
 *                         0,
 *                         0
 *                     ],
 *                     "type": "Point"
 *                 },
 *                 "minPrice": -1,
 *                 "maxPrice": -1,
 *                 "localPrice": {
 *                     "localMin": -1,
 *                     "localMax": -1,
 *                     "localAmount": 55531,
 *                     "amount": 143.31,
 *                     "minAmount": -1,
 *                     "maxAmount": -1,
 *                     "currencyCode": "NGN",
 *                     "currencySymbol": "₦",
 *                     "currencyCountryCode": "234"
 *                 },
 *                 "numberOfLikes": 50,
 *                 "moderation": {
 *                     "status": 3,
 *                     "comment": ""
 *                 },
 *                 "hashtags": [],
 *                 "visibility": "public",
 *                 "tribeIds": [],
 *                 "communityIds": [],
 *                 "_id": "5f158464552d4627382e297b",
 *                 "productMainCategoryId": "5d88d5551f657c440c4fd914",
 *                 "productSubCategoryId": "",
 *                 "categoryId": "5ec3ee665ea9301807bd24a6",
 *                 "name": "HyperX - CloudX Flight Wireless Stereo Gaming Headset - Black",
 *                 "description": "About this item\nOfficial Xbox licensed headset\nGaming-grade 2. 4GHz Wireless connection\nLong-lasting battery life up to 30 hours\nSignature HyperX comfort and durability\nBuilt-in headset chat mixer\nImmersive in-game audio with 50mm drivers\nDetachable microphone with Mic Monitoring and LED mute indicator",
 *                 "ownerId": "5f11806613c3a91fe32e74c6",
 *                 "status": 1,
 *                 "itemCount": 32,
 *                 "isNegotiable": false,
 *                 "condition": "Default",
 *                 "year": 2020,
 *                 "__v": 3,
 *                 "numberOfViews": 121,
 *                 "numberOfReviews": 3,
 *                 "rate": 3,
 *                 "type": 5,
 *                 "parentCategoryId": "-1",
 *                 "owner": {
 *                     "_id": "5f11806613c3a91fe32e74c6",
 *                     "token": [],
 *                     "pushToken": [],
 *                     "webPushSubscription": [],
 *                     "voipPushToken": [],
 *                     "groups": [
 *                         "5caf311bec0abb18999bd755"
 *                     ],
 *                     "muted": [],
 *                     "blocked": [],
 *                     "devices": [],
 *                     "UUID": [],
 *                     "bankAccounts": [],
 *                     "location": {
 *                         "type": "Point",
 *                         "coordinates": [
 *                             0,
 *                             0
 *                         ]
 *                     },
 *                     "locationVisibility": false,
 *                     "isAppUser": true,
 *                     "flomSupportAgentId": null,
 *                     "newUserNotificationSent": true,
 *                     "followedBusinesses": [
 *                         "6139cd7848c6c40f4dffb04a"
 *                     ],
 *                     "likedProducts": [],
 *                     "createdBusinessInFlom": false,
 *                     "onAnotherDevice": false,
 *                     "shadow": false,
 *                     "name": "ndnshs",
 *                     "organizationId": "5caf3119ec0abb18999bd753",
 *                     "status": 1,
 *                     "created": 1594982502401,
 *                     "phoneNumber": "+385977774088",
 *                     "userName": "mdragic03",
 *                     "invitationUri": "https://flom.page.link/1mMEX2zCP9QzX2Js8",
 *                     "activationCode": null,
 *                     "__v": 75,
 *                     "typeAcc": 2,
 *                     "description": "Flom me some",
 *                     "avatar": {
 *                         "picture": {
 *                             "originalName": "cropped834230393409265906.jpg",
 *                             "size": 2771306,
 *                             "mimeType": "image/png",
 *                             "nameOnServer": "profile-pUsxE83rh1FATDvvyAheKQ81"
 *                         },
 *                         "thumbnail": {
 *                             "originalName": "cropped834230393409265906.jpg",
 *                             "size": 60200,
 *                             "mimeType": "image/png",
 *                             "nameOnServer": "thumb-i2T4337nUnonks2s5xYMUVrfuX"
 *                         }
 *                     },
 *                     "email": "nikolicstjepansb@gmail.com",
 *                     "featured": [
 *                         2
 *                     ],
 *                     "recentlyViewedProducts": [],
 *                     "blockedProducts": 0,
 *                     "cover": {
 *                         "banner": {
 *                             "file": {
 *                                 "originalName": "1 874.png",
 *                                 "nameOnServer": "defaultBanner",
 *                                 "size": 70369,
 *                                 "mimeType": "image/png",
 *                                 "aspectRatio": 3.13044
 *                             },
 *                             "fileType": 0,
 *                             "thumb": {
 *                                 "originalName": "1 874.png",
 *                                 "nameOnServer": "defaultBannerThumb",
 *                                 "mimeType": "image/jpeg",
 *                                 "size": 174000
 *                             }
 *                         }
 *                     },
 *                     "isCreator": false,
 *                     "isSeller": true,
 *                     "notifications": {
 *                         "timestamp": 0,
 *                         "unreadCount": 1
 *                     },
 *                     "memberships": [],
 *                     "phoneNumberStatus": 1
 *                 },
 *                 "category": {
 *                     "_id": "5ec3ee665ea9301807bd24a6",
 *                     "name": "Electronics & accessories",
 *                     "parentId": "-1",
 *                     "__v": 0,
 *                     "group": [
 *                         1
 *                     ],
 *                     "deleted": false
 *                 }
 *             },
 *         ]
 *     }
 * }
 *
 **/

router.post("/", async function (request, response) {
  try {
    const productId = request.body.productId;
    const accessToken = request.headers["access-token"];

    if (!productId) return Base.successResponse(response, Const.responsecodeNoProductId);

    let product = await Product.findOne({ _id: productId, isDeleted: false }).lean();
    if (!product) return Base.successResponse(response, Const.responsecodeProductNotFound);

    const categoryId = product.categoryId;
    const productMainCategoryId = product.productMainCategoryId;
    const ownerId = product.ownerId;

    let kidsMode, blocked;
    let orQuery2 = [];
    var user;
    const { userRate, userCountryCode, userCurrency, conversionRates } =
      await Utils.getUsersConversionRate({
        user: request.user,
        accessToken: request.headers["access-token"],
      });

    if (accessToken) {
      user = await User.findOne({ "token.token": accessToken }).lean();
      if (!user) return Base.successResponse(response, Const.responsecodeSigninInvalidToken);

      kidsMode = user.kidsMode;
      blocked = user.blocked || [];

      let userTribeIdsArray = await Tribe.aggregate([
        {
          $match: {
            $or: [{ ownerId: user._id.toString() }, { "members.accepted.id": user._id.toString() }],
          },
        },
        { $project: { _id: 1 } },
      ]);
      userTribeIdsArray = userTribeIdsArray.map((element) => {
        return element._id;
      });

      if (!userTribeIdsArray || userTribeIdsArray.length === 0)
        orQuery2.push({ visibility: "public" });
      else orQuery2.push({ visibility: "public" }, { tribeIds: { $in: userTribeIdsArray } });
    } else {
      orQuery2.push({ visibility: "public" });
    }

    let orQuery1 = [];
    if (categoryId) orQuery1.push({ categoryId });
    if (productMainCategoryId) orQuery1.push({ productMainCategoryId });
    if (ownerId) orQuery1.push({ ownerId });

    const query = {
      _id: { $ne: productId },
      $and: [{ $or: orQuery1 }, { $or: orQuery2 }],
      "moderation.status": Const.moderationStatusApproved,
      type: product.type || 5,
      isDeleted: false,
    };
    if (kidsMode === true || !user) query.appropriateForKids = true;
    if (blocked && blocked.length > 0) query.ownerId = { $nin: blocked };

    let similarProducts = await Product.find(query);

    let allOwners = [];
    let categoriesSet = new Set();

    similarProducts = similarProducts.map((product) => {
      allOwners.push(product.ownerId);
      categoriesSet.add(product.categoryId.toString());
      if (product.parentCategoryId !== "-1") {
        categoriesSet.add(product.parentCategoryId);
      }
      Utils.addUserPriceToProduct({
        product,
        userRate,
        userCountryCode,
        userCurrency,
        conversionRates,
      });
      return product.toObject();
    });

    const owners = await User.find({ _id: { $in: allOwners } }).lean();

    let ownersObj = {};
    owners.forEach((owner) => {
      ownersObj[owner._id.toString()] = owner;
    });

    const categories = await Category.find({ _id: { $in: [...categoriesSet] } }).lean();
    let categoriesObj = {};
    categories.forEach((category) => {
      categoriesObj[category._id.toString()] = category;
    });

    similarProducts = similarProducts.map((product) => {
      const productExtended = {
        ...product,
        owner: ownersObj[product.ownerId],
        category: categoriesObj[product.categoryId.toString()],
      };
      if (product.parentCategoryId !== "-1") {
        productExtended.parentCategory = categoriesObj[product.parentCategoryId];
      }
      return productExtended;
    });

    Base.successResponse(response, Const.responsecodeSucceed, { similarProducts });
  } catch (e) {
    Base.errorResponse(response, Const.httpCodeServerError, "GetSimilarProductsController", e);
  }
});

module.exports = router;
