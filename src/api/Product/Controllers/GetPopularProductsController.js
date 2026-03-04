"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { Product, View, User, Configuration, AdminPageUser, Tribe } = require("#models");

/**
 * @api {get} /api/v2/products/popular Get Popular Products
 * @apiVersion 2.0.11
 * @apiName Get Popular Products
 * @apiGroup WebAPI Products
 * @apiDescription API for fetching those products accessed in the last 48 hours, sorted by the number of views.
 *
 * @apiParam None
 *
 * @apiSuccessExample {json} Success-Response:
 * {
 *     "code": 1,
 *     "time": 1657007432731,
 *     "data": {
 *         "products": [
 *             {
 *                 "_id": "62ac7f982d0d3056ea77119b",
 *                 "price": -1,
 *                 "created": 1655472024932,
 *                 "modified": 1655472024932,
 *                 "file": [
 *                     {
 *                         "file": {
 *                             "originalName": "za9veQYOwCf0Lurt_1655471.980970.mp4",
 *                             "nameOnServer": "ORnT53LGORq2CgYuzzGwglXBuLeDRbCI",
 *                             "width": 568,
 *                             "height": 320,
 *                             "aspectRatio": 0.56338,
 *                             "duration": 5,
 *                             "mimeType": "video/mp4",
 *                             "size": 488431,
 *                             "hslName": "8JyMXDXGvb18RYsnlLJltbINx8J8t4om"
 *                         },
 *                         "thumb": {
 *                             "originalName": "za9veQYOwCf0Lurt_1655471.980970.mp4",
 *                             "nameOnServer": "mmdav42PycaoJtDlnLr3qak11EvOpzc1",
 *                             "mimeType": "image/png",
 *                             "size": 100433
 *                         },
 *                         "_id": "62ac7f982d0d3056ea77119c",
 *                         "fileType": 1,
 *                         "order": 0
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
 *                     "localAmount": -1,
 *                     "amount": -1,
 *                     "minAmount": -1,
 *                     "maxAmount": -1
 *                 },
 *                 "numberOfLikes": 0,
 *                 "moderation": {
 *                     "status": 3,
 *                     "comment": ""
 *                 },
 *                 "hashtags": [
 *                     "62ac7f982d0d3056ea77119a"
 *                 ],
 *                 "visibility": "public",
 *                 "tribeIds": [],
 *                 "name": "I dalje muha",
 *                 "description": "Kaaaj?",
 *                 "type": 1,
 *                 "tags": "#flomboyant",
 *                 "ownerId": "5f87132ffa90652b60469b96",
 *                 "parentCategoryId": "5ca44bda08f8045e4e3471d2",
 *                 "categoryId": "5ec3ee665ea9301807bd24d9",
 *                 "appropriateForKids": true,
 *                 "__v": 0,
 *                 "numberOfViews": 301,
 *                 "recentViews": 11,
 *                 "owner": {
 *                     "_id": "5f87132ffa90652b60469b96",
 *                     "token": [],
 *                     "pushToken": [],
 *                     "webPushSubscription": [],
 *                     "voipPushToken": [],
 *                     "groups": [],
 *                     "muted": [],
 *                     "blocked": [],
 *                     "devices": [],
 *                     "UUID": [],
 *                     "bankAccounts": [],
 *                     "location": {
 *                         "type": "Point",
 *                         "coordinates": [
 *                             15.995498,
 *                             45.775759
 *                         ]
 *                     },
 *                     "locationVisibility": false,
 *                     "isAppUser": true,
 *                     "flomAgentId": null,
 *                     "newUserNotificationSent": true,
 *                     "followedBusinesses": [],
 *                     "likedProducts": [],
 *                     "createdBusinessInFlom": false,
 *                     "onAnotherDevice": true,
 *                     "shadow": false,
 *                     "name": "James_Riddle",
 *                     "organizationId": "5caf3119ec0abb18999bd753",
 *                     "status": 1,
 *                     "created": 1602687791835,
 *                     "phoneNumber": "+2348020000010",
 *                     "userName": "James_Riddle",
 *                     "invitationUri": "https://flom.page.link/bwyTf7gTpKono5TW6",
 *                     "__v": 379,
 *                     "avatar": {
 *                         "picture": {
 *                             "originalName": "image_1638974601.jpg",
 *                             "size": 131446,
 *                             "mimeType": "image/png",
 *                             "nameOnServer": "jNklNbbXnRgwDgef5zNartoS6pZSMPY8"
 *                         },
 *                         "thumbnail": {
 *                             "originalName": "image_1638974601.jpg",
 *                             "size": 79800,
 *                             "mimeType": "image/png",
 *                             "nameOnServer": "KPZP4fE8PmqG4YPmJPoHfv9CN6BCiqSf"
 *                         }
 *                     },
 *                     "description": "Power leads to more power.",
 *                     "email": "luka.d@clover.studio",
 *                     "blockedProducts": 0,
 *                     "activationCode": null,
 *                     "featuredProductTypes": [],
 *                     "memberships": [],
 *                     "recentlyViewedProducts": [],
 *                     "socialMedia": [],
 *                     "typeAcc": 1,
 *                     "cover": {
 *                         "banner": {
 *                             "file": {
 *                                 "originalName": "imageB_1643200918.jpg",
 *                                 "nameOnServer": "2eEvZ2Dx17Ejk1CvzkLdPFlfGEAERo47",
 *                                 "size": 701318,
 *                                 "mimeType": "image/png",
 *                                 "aspectRatio": 3.20475
 *                             },
 *                             "fileType": 0,
 *                             "thumb": {
 *                                 "originalName": "imageB_1643200918.jpg",
 *                                 "nameOnServer": "fwwYWZxUU1bWHKMC33WhiFYKN9UNpEe7",
 *                                 "mimeType": "image/jpeg",
 *                                 "size": 299000
 *                             }
 *                         },
 *                         "audio": {
 *                             "file": {
 *                                 "originalName": "311109AB-9620-46B7-BDC0-8BAECD134AF0.aac",
 *                                 "nameOnServer": "4Uo2bjmtYx1062KWvZhwWDGTLMX9cwMG.mp3",
 *                                 "mimeType": "audio/mpeg",
 *                                 "duration": 4.623673,
 *                                 "size": 74231,
 *                                 "hslName": "ajXgxMJAUvRbRRPu530N0Ii58PUJdFHJ"
 *                             },
 *                             "fileType": 2
 *                         }
 *                     },
 *                     "isCreator": true,
 *                     "isSeller": true,
 *                     "notifications": {
 *                         "timestamp": 1657006854065,
 *                         "unreadCount": 5
 *                     },
 *                     "aboutBusiness": "What am I? Am I a riddle?",
 *                     "workingHours": {
 *                         "start": "08:00",
 *                         "end": "16:00"
 *                     },
 *                     "paymentProfileId": "903810455",
 *                     "businessCategory": {
 *                         "_id": "5ec3ee665ea9301807bd24a5",
 *                         "name": "Creators"
 *                     },
 *                     "categoryBusinessId": "5ec3ee665ea9301807bd24a5",
 *                     "phoneNumberStatus": 1
 *                 }
 *             }
 *         ]
 *     }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 */

router.get("/", async function (request, response) {
  try {
    const accessToken = request.headers["access-token"];
    const popularProductsFetchPeriod = await Configuration.findOne(
      {
        name: "popularProductsFetchPeriod",
      },
      { value: 1 },
    ).lean();
    const popularProductsFetchPeriodInMs = popularProductsFetchPeriod.value * 60 * 60 * 1000;
    const currentDate = Utils.now();

    let resultArray = [];
    let query = {};

    let kidsMode,
      blocked = [];
    const { userRate, userCountryCode, userCurrency, conversionRates } =
      await Utils.getUsersConversionRate({
        user: request.user,
        accessToken: request.headers["access-token"],
      });

    if (!accessToken) {
      query = {
        $and: [{ visibility: "public" }, { "moderation.status": Const.moderationStatusApproved }],
      };
      kidsMode = true;
    } else if (accessToken && accessToken.length !== Const.tokenLength) {
      const adminUser = await AdminPageUser.findOne({ "token.token": accessToken }).lean();
      if (!adminUser) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeSigninInvalidToken,
          message: "Get popular products controller, invalid admin token",
        });
      }
    } else {
      const user = await User.findOne({ "token.token": accessToken }).lean();
      if (!user)
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeSigninInvalidToken,
          message: "Get popular products controller, invalid user token",
        });

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

      query = {
        $and: [
          {
            $or: [{ visibility: "public" }, { tribeIds: { $in: userTribeIdsArray } }],
          },
          {
            $or: [
              { "moderation.status": Const.moderationStatusApproved },
              { ownerId: user._id.toString() },
            ],
          },
        ],
      };
    }

    const productsArray = await View.aggregate([
      { $match: { created: { $gt: currentDate - popularProductsFetchPeriodInMs } } },
      { $group: { _id: "$productId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    if (!_.isEmpty(productsArray)) {
      const productIdsArray = productsArray.map((element) => {
        return element._id;
      });

      query._id = { $in: productIdsArray };
      query.isDeleted = false;
      if (blocked.length > 0) query.ownerId = { $nin: blocked };
      if (kidsMode === true) query.appropriateForKids = true;

      const productObjects = await Product.find(query).lean();

      const ownerIdsArray = productObjects.map((product) => product.ownerId);
      const ownerObjects = await User.find({ _id: ownerIdsArray }).lean();
      const ownerObjectsEdited = {};
      for (let i = 0; i < ownerObjects.length; i++) {
        ownerObjectsEdited[ownerObjects[i]._id] = ownerObjects[i];
      }

      for (let i = 0; i < productIdsArray.length; i++) {
        const product = productObjects.find((item) => item._id.toString() === productIdsArray[i]);
        if (product) {
          product.recentViews = productsArray[i].count;
          product.owner = ownerObjectsEdited[product.ownerId];

          Utils.addUserPriceToProduct({
            product,
            userRate,
            userCountryCode,
            userCurrency,
            conversionRates,
          });

          resultArray.push(product);
        }
      }
    }

    Base.successResponse(response, Const.responsecodeSucceed, { products: resultArray });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "GetPopularProductsController",
      error,
    });
  }
});

module.exports = router;
