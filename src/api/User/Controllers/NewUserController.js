"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const Utils = require("#utils");
const { User, Group, Membership, Organization, Product, Transaction } = require("#models");
const { getUsersOnlineStatus } = require("#logics");

/**
 * @api {get} /api/v2/users Get user list
 * @apiVersion 2.0.8
 * @apiName Get user list
 * @apiGroup WebAPI User
 * @apiDescription API for getting user list.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam (Query string) {String} [phoneNumber] Users phone number
 * @apiParam (Query string) {String} [username] Users username
 * @apiParam (Query string) {String} [page] Page for paging
 * @apiParam (Query string) {String} [featuredProductType] types of products user is featured in
 * @apiParam (Query string) {String} [normalProductType] types of products user is not featured in
 * @apiParam (Query string) {String} [blockedProducts] 0 - user is not blocked. 1 - user is blocked.
 * @apiParam (Query string) {String} [deviceType] type of device user is using (web, ios, android)
 * @apiParam (Query string) {String} [userNameChanged] "true" - only users who changed username, "false" - only users who didn't change, not sent - all users
 * @apiParam (Query string) {String} [hasLoggedIn] 1 - at least once, 2 - never, 3 - old user, 4 - shadow user
 * @apiParam (Query string) {String} [isDeleted] "true" - only deleted, "false" - only non-deleted, not sent - all users
 *
 * @apiSuccessExample {json} Success-Response:
 * {
 *   "code": 1,
 *   "time": 1624535998267,
 *   "data": {
 *     "users": [
 *       {
 *         "id": "60e4384b560d1466637e3eca",
 *         "phoneNumber": "+2348020000019",
 *         "username": "floMaster",
 *         "email": "flom@master.com",
 *         "firstName": "Flom",
 *         "lastName": "Master",
 *         "avatar": {
 *           "picture": {
 *             "originalName": "cropped337518704814023559.jpg",
 *             "size": 5465474,
 *             "mimeType": "image/png",
 *             "nameOnServer": "profile-mPXy2j7CJfHbB9XYMdNTiTEV",
 *             "link": "https://dev.flom.app/api/v2/avatar/user/profile-mPXy2j7CJfHbB9XYMdNTiTEV"
 *           },
 *           "thumbnail": {
 *             "originalName": "cropped337518704814023559.jpg",
 *             "size": 105000,
 *             "mimeType": "image/png",
 *             "nameOnServer": "thumb-g5lv1oTLosE8yn1O7wmhNMnI2r",
 *             "link": "https://dev.flom.app/api/v2/avatar/user/thumb-g5lvboTLosE8yn1O7wmhNMnI2r"
 *           }
 *         },
 *         "featuredProductTypes": [ 1 , 2 ],
 *         "blockedProducts": 0,
 *       },
 *     ],
 *     "total": 76,
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443128 Invalid type parameter in either featuredProductType (type has to be between 1 and 5)
 * @apiError (Errors) 400180 Wrong phoneNumber parameter
 * @apiError (Errors) 400271 Wrong username parameter
 * @apiError (Errors) 443801 Invalid parameter (name in error message)
 * @apiError (Errors) 4000007 Token not valid
 */

router.get("/", auth({ allowAdmin: true, role: Const.Role.ADMIN }), async (request, response) => {
  try {
    const { phoneNumber, username, featuredProductType, normalProductType, deviceType } =
      request.query;
    const blockedProducts = +request.query.blockedProducts;
    const hasLoggedIn = !request.query.hasLoggedIn ? null : +request.query.hasLoggedIn;
    const userNameChanged =
      request.query.userNameChanged === "true"
        ? true
        : request.query.userNameChanged === "false"
        ? false
        : null;
    const isDeleted =
      request.query.isDeleted === "true"
        ? true
        : request.query.isDeleted === "false"
        ? false
        : null;
    const page = +request.query.page || 1;
    const searchQuery = { $and: [] };

    if (phoneNumber === "") {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoPhoneNumber,
        message: `NewUserController - list, wrong phoneNumber parameter`,
      });
    } else if (phoneNumber) {
      let formattedPhoneNumber = phoneNumber.replace(/\D/g, "");
      if (formattedPhoneNumber.startsWith(" ") || formattedPhoneNumber.startsWith("0")) {
        formattedPhoneNumber = "+" + formattedPhoneNumber.substring(1);
      }

      if (!formattedPhoneNumber.startsWith("+")) {
        formattedPhoneNumber = "+" + formattedPhoneNumber;
      }
      searchQuery.$and.push({ phoneNumber: formattedPhoneNumber });
    }
    if (username === "") {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoUsername,
        message: `NewUserController - list, wrong username parameter`,
      });
    } else if (username) {
      const regex = new RegExp(username, "i");
      searchQuery.$and.push({ userName: regex });
    }

    try {
      const validatedFeaturedProductTypes = validateProductTypes(featuredProductType);
      if (validatedFeaturedProductTypes) {
        searchQuery.$and.push({
          "featured.types": { $all: validatedFeaturedProductTypes },
        });
      }
      const validatedNormalProductTypes = validateProductTypes(normalProductType);
      if (validatedNormalProductTypes) {
        searchQuery.$and.push({
          "featured.types": { $nin: validatedNormalProductTypes },
        });
      }
    } catch (error) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidTypeParameter,
        message: `NewUserController - list, invalid type parameter`,
      });
    }

    if (blockedProducts === 0 || blockedProducts === 1) {
      searchQuery.$and.push({ blockedProducts });
    }

    if (deviceType) {
      if (!["web", "ios", "android", "unknown"].includes(deviceType)) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidParameter,
          message: `NewUserController - list, invalid deviceType parameter`,
          param: "deviceType",
        });
      }

      searchQuery.$and.push({
        deviceType: deviceType === "unknown" ? { $nin: validDeviceTypes } : deviceType,
      });
    }

    if (hasLoggedIn) {
      if (![1, 2, 3, 4].includes(hasLoggedIn)) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidParameter,
          message: `NewUserController - list, invalid hasLoggedIn parameter`,
          param: "hasLoggedIn",
        });
      }

      searchQuery.$and.push({ hasLoggedIn });
    }

    if (isDeleted === true) {
      searchQuery.$and.push({ "isDeleted.value": true });
    } else if (isDeleted === false) {
      searchQuery.$and.push({ "isDeleted.value": false });
    }

    if (searchQuery.$and.length === 0) {
      delete searchQuery.$and;
    }

    if (userNameChanged === false) {
      searchQuery.userName = /^Flomer_/i;
    } else if (userNameChanged === true) {
      searchQuery.userName = /^(?!Flomer_).+/i;
    }

    let users = await User.find(searchQuery)
      .sort({ created: -1 })
      .skip((page - 1) * Const.newPagingRows)
      .limit(Const.newPagingRows)
      .lean();

    const total = await User.countDocuments(searchQuery);

    const usersFormatted = [];
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      usersFormatted.push({
        id: user._id.toString(),
        phoneNumber: user.phoneNumber,
        username: user.userName,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        featured: user.featured || { types: [], countryCode: "default" },
        blockedProducts: user.blockedProducts || 0,
        internationalUser: user.internationalUser,
        deviceType: user.deviceType || "unknown",
        hasLoggedIn: user.hasLoggedIn,
        created: user.created,
      });
    }

    Base.successResponse(response, Const.responsecodeSucceed, { users: usersFormatted, total });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "NewUserController - list",
      error,
    });
  }
});

/**
 * @api {get} /api/v2/users/:userId Get user
 * @apiVersion 2.0.8
 * @apiName Get user
 * @apiGroup WebAPI User
 * @apiDescription API for getting user details.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiSuccessExample {json} Success-Response:
 * {
 *     "code": 1,
 *     "time": 1672150671855,
 *     "data": {
 *         "user": {
 *             "id": "627129e9f560ae2b30f91723",
 *             "phoneNumber": "+2347088000001",
 *             "username": "627129e9f560ae2b30f91723",
 *             "email": "amper.sand@yahoo.com",
 *             "featuredProductTypes": [],
 *             "blockedProducts": 0
 *         },
 *         "mobileData": {
 *             "_id": "627129e9f560ae2b30f91723",
 *             "pushToken": [
 *                 "fgb1UE2hQgKqq4OOc8zRC7:APA91bGQlULD98TejRDhmWhJGNunzzRMR6fx6mnvT8BSDvgUPbnURV74nOPBFOx7PGMH8E9hitEcuVkdPs3AMgq58hpG8Fp2mu0WuB9bcaBHLA9ZdVW6U1d6pRPID97okeceJY_-P6lD"
 *             ],
 *             "webPushSubscription": [],
 *             "voipPushToken": [],
 *             "groups": [
 *                 "5caf311bec0abb18999bd755"
 *             ],
 *             "muted": [],
 *             "blocked": [],
 *             "devices": [],
 *             "UUID": [
 *                 {
 *                     "lastLogin": 1651583476919,
 *                     "blocked": null,
 *                     "lastToken": [],
 *                     "pushTokens": [
 *                         "fgb1UE2hQgKqq4OOc8zRC7:APA91bGQlULD98TejRDhmWhJGNunzzRMR6fx6mnvT8BSDvgUPbnURV74nOPBFOx7PGMH8E9hitEcuVkdPs3AMgq58hpG8Fp2mu0WuB9bcaBHLA9ZdVW6U1d6pRPID97okeceJY_-P6lD"
 *                     ]
 *                 }
 *             ],
 *             "bankAccounts": [],
 *             "location": {
 *                 "type": "Point",
 *                 "coordinates": [
 *                     0,
 *                     0
 *                 ]
 *             },
 *             "isAppUser": true,
 *             "flomSupportAgentId": null,
 *             "newUserNotificationSent": false,
 *             "followedBusinesses": [],
 *             "likedProducts": [],
 *             "recentlyViewedProducts": [],
 *             "createdBusinessInFlom": false,
 *             "onAnotherDevice": true,
 *             "shadow": false,
 *             "featuredProductTypes": [],
 *             "blockedProducts": 0,
 *             "memberships": [],
 *             "socialMedia": [],
 *             "isCreator": false,
 *             "isSeller": false,
 *             "name": "+2347*****0001",
 *             "organizationId": "5caf3119ec0abb18999bd753",
 *             "status": 1,
 *             "created": 1651583465744,
 *             "phoneNumber": "+2347088000001",
 *             "userName": "627129e9f560ae2b30f91723",
 *             "invitationUri": "https://qrios.page.link/bfEgSYHNFr7kVnek6",
 *             "activationCode": null,
 *             "__v": 1,
 *             "typeAcc": 2,
 *             "phoneNumberStatus": 1,
 *             "isDeleted": {
 *                 "value": false,
 *                 "created": 1659622064333
 *             },
 *             "email": "amper.sand@yahoo.com",
 *             "locationVisibility": false,
 *             "creditBalance": 0,
 *             "groupModels": [
 *                 {
 *                     "_id": "5caf311bec0abb18999bd755",
 *                     "users": [
 *                         "5caf311aec0abb18999bd754"
 *                     ],
 *                     "name": "Top",
 *                     "sortName": "top",
 *                     "description": "",
 *                     "created": 1554985243743,
 *                     "organizationId": "5caf3119ec0abb18999bd753",
 *                     "parentId": "",
 *                     "type": 2,
 *                     "default": true,
 *                     "__v": 0
 *                 }
 *             ],
 *             "organization": {
 *                 "_id": "5caf3119ec0abb18999bd753",
 *                 "name": "flomorg",
 *                 "organizationId": "flomorg"
 *             },
 *             "onlineStatus": null,
 *             "productsCount": 0,
 *             "cover": {
 *                 "banner": {
 *                     "file": {
 *                         "originalName": "1 874.png",
 *                         "nameOnServer": "defaultBanner",
 *                         "size": 70369,
 *                         "mimeType": "image/png",
 *                         "aspectRatio": 3.13044
 *                     },
 *                     "fileType": 0,
 *                     "thumb": {
 *                         "originalName": "1 874.png",
 *                         "nameOnServer": "defaultBannerThumb",
 *                         "mimeType": "image/jpeg",
 *                         "size": 174000
 *                     }
 *                 }
 *             },
 *             "soldProductsCount": 0,
 *             "subscribersCount": 0,
 *             "creatorMemberships": [],
 *             "membersCount": 0
 *         }
 *     }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443230 Invalid userId parameter
 * @apiError (Errors) 4000760 User with userId not found
 * @apiError (Errors) 4000007 Token not valid
 */

router.get(
  "/:userId",
  auth({ allowUser: true, allowAdmin: true, role: Const.Role.ADMIN }),
  async (request, response) => {
    try {
      const { userId } = request.params;

      if (!Utils.isValidObjectId(userId)) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidUserId,
          message: `NewUserController - get user, invalid userId parameter`,
        });
      }

      const user = await User.findOne({ _id: userId }).lean();
      if (!user) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeUserNotFound,
          message: `NewUserController - get user, user with id ${userId} not found`,
        });
      }

      const userDetails = await getUserDetails(user, request.headers["access-token"]);

      Base.successResponse(response, Const.responsecodeSucceed, {
        user: {
          id: user._id.toString(),
          phoneNumber: user.phoneNumber,
          username: user.userName,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
          featured: user.featured || { types: [], countryCode: "default" },
          blockedProducts: user.blockedProducts || 0,
          internationalUser: user.internationalUser,
          deviceType: user.deviceType || "unknown",
          hasLoggedIn: user.hasLoggedIn,
          created: user.created,
          payoutLimit: user.payoutLimit,
        },
        mobileData: userDetails,
      });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "NewUserController - get user",
        error,
      });
    }
  },
);

function validateProductTypes(requestTypesArray) {
  if (requestTypesArray && requestTypesArray.length) {
    const typesArray = [];
    for (let i = 0; i < requestTypesArray.length; i++) {
      const type = +requestTypesArray[i];
      if (Const.productTypes.indexOf(type) === -1) {
        throw new Error();
      } else {
        typesArray.push(type);
      }
    }
    return [...new Set(typesArray)];
  }
}

async function getUserDetails(user, requestToken) {
  const userId = user._id.toString();

  let groupsLimited = user.groups;

  if (Array.isArray(groupsLimited)) {
    groupsLimited = groupsLimited.slice(0, 20);

    groupsLimited = groupsLimited.map(function (item) {
      return item.toString();
    });

    user.groupModels = await Group.find({ _id: { $in: groupsLimited } }).lean();
  }

  // get online status
  user.organization = await Organization.findOne(
    { _id: user.organizationId },
    {
      organizationId: 1,
      name: 1,
    },
  ).lean();

  // get online status
  const onlineStatusResult = await getUsersOnlineStatus([userId]);
  if (onlineStatusResult && onlineStatusResult[0]) {
    user.onlineStatus = onlineStatusResult[0].onlineStatus;
  } else {
    user.onlineStatus = 0;
  }

  const updatedUser = {};

  if (!user.isCreator) {
    const userContentCount = await Product.countDocuments({
      ownerId: userId,
      type: Const.productTypeVideo,
      isDeleted: false,
    });

    if (userContentCount > 0) {
      user.isCreator = true;
      updatedUser.isCreator = true;
    } else if (user.isCreator === undefined) {
      user.isCreator = false;
      updatedUser.isCreator = false;
    }
  }

  let userSoldProductsCount = 0;
  const userProducts = await Product.find(
    {
      ownerId: userId,
      type: Const.productTypeProduct,
      isDeleted: false,
    },
    { _id: 1 },
  ).lean();
  user.productsCount = userProducts.length;

  if (userProducts.length > 0) {
    if (!user.isSeller) {
      user.isSeller = true;
      updatedUser.isSeller = true;
    }

    const userProductIds = userProducts.map((product) => product._id.toString());
    userSoldProductsCount = await Transaction.countDocuments({
      completed: true,
      type: 1,
      productId: { $in: userProductIds },
    });
  } else if (user.isSeller === undefined) {
    user.isSeller = false;
    updatedUser.isSeller = false;
  }

  if (!user.cover || !user.cover.banner) {
    user.cover = { ...user.cover, banner: Const.defaultProfileBanner };
    updatedUser.cover = user.cover;
  }

  await User.updateOne({ _id: user._id }, { $set: { ...updatedUser } });
  user.soldProductsCount = userSoldProductsCount;

  user.subscribersCount = await User.countDocuments({ followedBusinesses: userId });

  const creatorMemberships = await Membership.find({ creatorId: userId, deleted: false })
    .sort({ order: 1 })
    .lean();
  user.creatorMemberships = creatorMemberships;

  const creatorMembershipIds = creatorMemberships.map((membership) => membership._id.toString());
  user.membersCount = await User.countDocuments({ memberships: { $in: creatorMembershipIds } });

  user.socialMedia = Utils.generateSocialMediaWithLinks({ socialMedia: user.socialMedia });

  const token = requestToken;
  if (!token) {
    delete user.notifications;
  } else {
    const requestUser = await User.findOne({ "token.token": token }, { _id: 1 }).lean();
    if (!requestUser || requestUser._id.toString() !== userId) {
      delete user.notifications;
    }
  }

  delete user.token;
  if (user.UUID) {
    for (let i = 0; i < user.UUID.length; i++) delete user.UUID[i].UUID;
  }

  return user;
}

module.exports = router;
