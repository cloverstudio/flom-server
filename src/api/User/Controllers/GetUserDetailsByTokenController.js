"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, Config } = require("#config");
const { auth } = require("#middleware");
const { AppVersion } = require("#models");
const { formatUserDetailsResponse } = require("#logics");

/**
 * @api {get} /api/v2/user/detail/token Get user details by token flom_v1
 * @apiVersion 2.0.16
 * @apiName Get user details by token flom_v1
 * @apiGroup WebAPI User
 * @apiDescription  Get user details by token.
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiSuccessExample Success Response
 * {
 *   "code": 1,
 *   "time": 1631783235064,
 *   "data": {
 *     "user": {
 *       "_id": "5f7ee464a283bc433d9d722f",
 *       "pushToken": [
 *         "cPTIMfiQBi4vWzVsEuB"
 *       ],
 *       "webPushSubscription": [],
 *       "voipPushToken": [],
 *       "groups": [
 *         "5caf311bec0abb18999bd755"
 *       ],
 *       "muted": [],
 *       "blocked": [],
 *       "devices": [],
 *       "UUID": [
 *         {
 *           "deviceName": "XQ-AS52",
 *           "lastLogin": 1630318511790,
 *           "blocked": null,
 *           "lastToken": {
 *             "token": "*****",
 *             "generateAt": 1630318511790
 *           },
 *           "pushTokens": [
 *             "cPTIMfiQBi4vWzVsEuB"
 *           ]
 *         }
 *       ],
 *       "bankAccounts": [
 *         {
 *           "merchantCode": "40200168",
 *           "name": "SampleAcc",
 *           "accountNumber": "1503567574679",
 *           "code": "",
 *           "selected": true,
 *           "lightningUserName": "40200168",
 *           "lightningAddress": "40200168@v2.flom.dev",
 *           "lightningUrlEncoded": "LNURL1DP68GURN8GHJ7A3J9ENXCMMD9EJX2A309EMK2MRV944KUMMHDCHKCMN4WFK8QTE5XQERQVP3XCUQXZ6U2G"
 *         }
 *       ],
 *       "location": {
 *         "type": "Point",
 *         "coordinates": [
 *           0,
 *           0
 *         ]
 *       },
 *       "locationVisibility": false,
 *       "isAppUser": true,
 *       "flomAgentId": null,
 *       "newUserNotificationSent": true,
 *       "followedBusinesses": [],
 *       "likedProducts": [
 *         "5f4f5ab618f352279ef2a82d"
 *       ],
 *       "createdBusinessInFlom": false,
 *       "onAnotherDevice": true,
 *       "shadow": false,
 *       "name": "+2348*****0007",
 *       "organizationId": "5caf3119ec0abb18999bd753",
 *       "status": 1,
 *       "created": 1602151524372,
 *       "phoneNumber": "+2348020000007",
 *       "userName": "dragon2",
 *       "invitationUri": "https://flom.page.link/wnLdbuLTY4qfhbqo9",
 *       "__v": 115,
 *       "avatar": {
 *         "picture": {
 *           "originalName": "cropped2444207444774310745.jpg",
 *           "size": 4698848,
 *           "mimeType": "image/png",
 *           "nameOnServer": "profile-3XFUoWqVRofEPbMfC1Z9IDNj"
 *         },
 *         "thumbnail": {
 *           "originalName": "cropped2444207444774310745.jpg",
 *           "size": 97900,
 *           "mimeType": "image/png",
 *           "nameOnServer": "thumb-wDIl52el9inZOQ20yNn2PpnMwi"
 *         }
 *       },
 *       "lastName": "D",
 *       "description": "Don't steal my account!",
 *       "firstName": "Marko",
 *       "activationCode": null,
 *       "typeAcc": 1,
 *       "email": "marko.d@clover.studio",
 *       "recentlyViewedProducts": [
 *         "611a34bafb0dff46efb379dc"
 *       ],
 *       "paymentProfileId": "900720084",
 *       "featuredProductTypes": [
 *         1,
 *         2
 *       ],
 *       "blockedProducts": 0,
 *       "cover": {},
 *       "memberships": [],
 *       "socialMedia": [
 *         {
 *           "username": "spotiii",
 *           "type": 1
 *         },
 *         {
 *           "username": "aplalll",
 *           "type": 2
 *         },
 *         {
 *           "username": "zoutuu",
 *           "type": 5,
 *           "profileWebUrl": "https://www.youtube.com/user/zoutuu",
 *           "profileIOSUrl": "youtube://www.youtube.com/user/zoutuu",
 *           "profileAndroidUrl": "youtube://www.youtube.com/user/zoutuu"
 *         }
 *       ],
 *       "isCreator": true,
 *       "isSeller": true,
 *       "groupModels": [
 *         {
 *           "_id": "5caf311bec0abb18999bd755",
 *           "users": [
 *             "5caf311aec0abb18999bd754"
 *           ],
 *           "name": "Top",
 *           "sortName": "top",
 *           "description": "",
 *           "created": 1554985243743,
 *           "organizationId": "5caf3119ec0abb18999bd753",
 *           "parentId": "",
 *           "type": 2,
 *           "default": true,
 *           "__v": 0
 *         }
 *       ],
 *       "organization": {
 *         "_id": "5caf3119ec0abb18999bd753",
 *         "name": "flomorg",
 *         "organizationId": "flomorg"
 *       },
 *       "onlineStatus": null,
 *       "productsCount": 17,
 *       "soldProductsCount": 0,
 *       "subscribersCount": 2,
 *       "creatorMemberships": [
 *         {
 *           "_id": "6141c7a02f95906c64e83c43",
 *           "benefits": [
 *             {
 *               "type": 1,
 *               "title": "Group chat",
 *               "enabled": true
 *             },
 *             {
 *               "type": 2,
 *               "title": "Private messaging",
 *               "enabled": false
 *             },
 *             {
 *               "type": 3,
 *               "title": "Video call",
 *               "enabled": false
 *             },
 *             {
 *               "type": 4,
 *               "title": "Audio call",
 *               "enabled": false
 *             }
 *           ],
 *           "created": 1631700896862,
 *           "name": "Plan 1",
 *           "amount": 4.99,
 *           "description": "This is the lowest plan. Enjoy it!",
 *           "order": 1,
 *           "creatorId": "5f7ee464a283bc433d9d722f",
 *           "__v": 0
 *         },
 *       ],
 *       "membersCount": 1,
 *       "notifications": { //present only if you get details of your own user
 *         "timestamp": 1631700896862,
 *         "unreadCount": 0,
 *       }
 *     },
 *     "androidBuildVersion": "56",
 *     "iosBuildVersion": "72"
 *     "groupCallBaseUrl": "https://devgroupcall.flom.app/"
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 400273 User deleted
 * @apiError (Errors) 4000007 Token invalid
 */

router.get("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;

    if (user?.isDeleted.value) {
      return Base.successResponse(response, Const.responsecodeUserDeleted);
    }

    let appVersion = await AppVersion.findOne({});
    if (!appVersion) {
      appVersion = await AppVersion.create({
        iosBuildVersion: "72",
        androidBuildVersion: "56",
      });
    }

    await formatUserDetailsResponse({
      user,
      requestAccessToken: request.headers["access-token"],
    });

    Base.successResponse(response, Const.responsecodeSucceed, {
      user,
      androidBuildVersion: appVersion.androidBuildVersion,
      iosBuildVersion: appVersion.iosBuildVersion,
      groupCallBaseUrl: Config.groupCallBaseUrl,
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "GetUserDetailsByTokenController",
      error,
    });
  }
});

module.exports = router;
