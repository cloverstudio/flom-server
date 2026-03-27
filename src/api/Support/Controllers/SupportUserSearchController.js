"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, Config } = require("#config");
const { User } = require("#models");

/**
 * @api {get} /api/v2/support/user-search  Search users for support agent flom_v1
 * @apiVersion 2.0.17
 * @apiName  Search users for support agent flom_v1
 * @apiGroup WebAPI Support
 * @apiDescription  API which is used by Flom support agent to search for users by username or name.
 *
 * @apiHeader {String} access-token Users unique access token. Only Flom support user token allowed.
 *
 * @apiParam (Query string) {Number} [page]    Page
 * @apiParam (Query string) {String} [search]  Search term. Case insensitive.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1705402542161,
 *     "data": {
 *         "users": [
 *             {
 *                 "_id": "63ebd90e3ad20c240227fc9d",
 *                 "groups": [
 *                     "5caf311bec0abb18999bd755"
 *                 ],
 *                 "muted": [],
 *                 "blocked": [],
 *                 "devices": [],
 *                 "bankAccounts": [
 *                     {
 *                         "merchantCode": "40200168",
 *                         "name": "SampleAcc",
 *                         "accountNumber": "1503567574679",
 *                         "code": "",
 *                         "selected": true,
 *                         "lightningUserName": "40200168",
 *                         "lightningAddress": "40200168@v2.flom.dev",
 *                         "lightningUrlEncoded": "LNURL1DP68GURN8GHJ7A3J9ENXCMMD9EJX2A309EMK2MRV944KUMMHDCHKCMN4WFK8QTE5XQERQVP3XCUQXZ6U2G"
 *                     }
 *                 ],
 *                 "location": {
 *                     "type": "Point",
 *                     "coordinates": [
 *                         0,
 *                         0
 *                     ]
 *                 },
 *                 "isAppUser": true,
 *                 "flomSupportAgentId": null,
 *                 "newUserNotificationSent": true,
 *                 "followedBusinesses": [],
 *                 "likedProducts": [],
 *                 "recentlyViewedProducts": [
 *                     "64de1c2cac26a950e2f8c014",
 *                     "63eb795640b77f3955203328",
 *                     "64f1a73e202e1976fd1c7cdd",
 *                     "63e380262a439852f927d4db",
 *                     "63eb7e2940b77f395520335e",
 *                     "64885cee70f2cb4107915760"
 *                 ],
 *                 "createdBusinessInFlom": false,
 *                 "onAnotherDevice": true,
 *                 "shadow": false,
 *                 "isDeleted": {
 *                     "value": false,
 *                     "created": 1676400910297
 *                 },
 *                 "featuredProductTypes": [],
 *                 "blockedProducts": 0,
 *                 "memberships": [],
 *                 "socialMedia": [],
 *                 "isCreator": true,
 *                 "isSeller": true,
 *                 "notifications": {
 *                     "timestamp": 1703254737466,
 *                     "unreadCount": 0
 *                 },
 *                 "phoneNumberStatus": 3,
 *                 "payoutFrequency": 5,
 *                 "lastPayoutDate": 0,
 *                 "merchantApplicationStatus": null,
 *                 "locationVisibility": false,
 *                 "creditBalance": 1204,
 *                 "deletedUserInfo": {
 *                     "bankAccounts": []
 *                 },
 *                 "name": "Petar B",
 *                 "organizationId": "5caf3119ec0abb18999bd753",
 *                 "status": 1,
 *                 "created": 1676400910297,
 *                 "phoneNumber": "+2348020000012",
 *                 "userName": "Petar B",
 *                 "invitationUri": "https://qrios.page.link/46L4fbzib1Fn592u8",
 *                 "activationCode": null,
 *                 "__v": 7,
 *                 "typeAcc": 1,
 *                 "cover": {
 *                     "banner": {
 *                         "file": {
 *                             "originalName": "1 874.png",
 *                             "nameOnServer": "defaultBanner",
 *                             "size": 70369,
 *                             "mimeType": "image/png",
 *                             "aspectRatio": 3.13044
 *                         },
 *                         "fileType": 0,
 *                         "thumb": {
 *                             "originalName": "1 874.png",
 *                             "nameOnServer": "defaultBannerThumb",
 *                             "mimeType": "image/jpeg",
 *                             "size": 174000
 *                         }
 *                     }
 *                 },
 *                 "description": "Undescribeable",
 *                 "countryCode": "NG",
 *                 "email": "amper.sand@yahoo.com",
 *                 "emailActivation": {
 *                     "isVerified": true,
 *                     "code": "389757",
 *                     "timestamp": 1677583913146
 *                 },
 *                 "deviceType": "android",
 *                 "dateOfBirth": 568018800000,
 *                 "kidsMode": false,
 *                 "socialMediaLinks": [
 *                     {
 *                         "id": "150fcb63dbe03cfa9ad0c6e0",
 *                         "title": "Hello world New",
 *                         "url": "https://www.hello-world.com/hello/new",
 *                         "order": 1
 *                     }
 *                 ],
 *                 "satsBalance": 112663,
 *                 "lightningRequestTags": [
 *                     {
 *                         "tag": "cj2VW7WC",
 *                         "created": 1693589740992
 *                     }
 *                 ],
 *                 "hasLoggedIn": 1,
 *                 "lightningUserName": "kaka1991",
 *                 "lightningUrlEncoded": "LNURL1DP68GURN8GHJ7A3J9ENXCMMD9EJX2A309EMK2MRV944KUMMHDCHKCMN4WFK8QTMTV94KZVFE8YCSDSRWEG",
 *                 "lightningInfo": [
 *                     {
 *                         "userName": "1990",
 *                         "address": "kaka1990@v2.flom.dev",
 *                         "encodedUrl": "LNURL1DP68GURN8GHJ7A3J9ENXCMMD9EJX2A309EMK2MRV944KUMMHDCHKCMN4WFK8QTMTV94KZVFE8YCQC3TKVM"
 *                     },
 *                     {
 *                         "userName": "kaka1991",
 *                         "address": "kaka1991@v2.flom.dev",
 *                         "encodedUrl": "LNURL1DP68GURN8GHJ7A3J9ENXCMMD9EJX2A309EMK2MRV944KUMMHDCHKCMN4WFK8QTMTV94KZVFE8YCSDSRWEG"
 *                     }
 *                 ],
 *                 "hasChangedLnUserName": true,
 *                 "modified": 1700731169516,
 *                 "currency": "NGN",
 *                 "lastLogin": 1703254018712
 *             }
 *         ],
 *         "paginationData": {
 *             "page": 1,
 *             "total": 1,
 *             "hasNext": false
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
 * @apiError (Errors) 443460 No token
 * @apiError (Errors) 443461 Invalid token - support agent not found
 * @apiError (Errors) 443230 Invalid user id - user is not support agent
 * @apiError (Errors) 4000007 Token invalid
 */

router.get("/", async function (request, response) {
  try {
    const accessToken = request.headers["access-token"];
    if (!accessToken) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoToken,
        message: "SupportUserSearchController, no access token",
      });
    }

    const user = await User.findOne({ "token.token": accessToken }).lean();
    if (!user) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidToken,
        message: "SupportUserSearchController, invalid token - support agent not found",
      });
    }

    const userId = user._id.toString();

    if (userId !== Config.flomSupportAgentId) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidUserId,
        message: "SupportUserSearchController, invalid user id - user is not support agent",
      });
    }

    const pagingRows = 20;
    const page = request.query.page ? +request.query.page : 1;
    const skip = page > 0 ? (page - 1) * pagingRows : 0;

    const query = { "isDeleted.value": false };

    const search = request.query.search;
    if (search) {
      const regex = new RegExp(search, "i");
      query.$or = [{ userName: regex }, { name: regex }];
    }

    const total = await User.countDocuments(query);
    const hasNext = total > skip + pagingRows;

    const users = await User.find(query).limit(pagingRows).skip(skip).sort({ created: -1 }).lean();

    users.forEach((user) => {
      delete user.token;
      delete user.pushToken;
      delete user.webPushSubscription;
      delete user.voipPushToken;
      delete user.UUID;
    });

    const responseData = { users, paginationData: { page, total, hasNext } };
    Base.successResponse(response, Const.responsecodeSucceed, responseData);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "SupportUserSearchController",
      error,
    });
  }
});

module.exports = router;
