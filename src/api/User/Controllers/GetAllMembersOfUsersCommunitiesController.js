"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { Membership, User } = require("#models");
const { formatUserDetailsResponse } = require("#logics");

/**
 * @api {get} /api/v2/user/community-members Get all members of users communities flom_v1
 * @apiVersion 2.0.22
 * @apiName  Get all members of users communities flom_v1
 * @apiGroup WebAPI User
 * @apiDescription  Get all members of users communities.
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiParam (Query string) {String} [page]   Page number
 * @apiParam (Query string) {String} [size]   Page size
 * @apiParam (Query string) {String} [search] Username to search (case insensitive)
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1718017957715,
 *     "data": {
 *         "members": [
 *             {
 *                 "_id": "63dce956c30542684f1b7b63",
 *                 "groups": [
 *                     "5caf311bec0abb18999bd755"
 *                 ],
 *                 "muted": [],
 *                 "blocked": [],
 *                 "devices": [],
 *                 "UUID": [
 *                     {
 *                         "lastLogin": 1717752924218,
 *                         "blocked": null,
 *                         "lastToken": [
 *                             {
 *                                 "token": "*****",
 *                                 "generateAt": 1712748632148,
 *                                 "isWebClient": true
 *                             },
 *                             {
 *                                 "token": "*****",
 *                                 "generateAt": 1712748971688,
 *                                 "isWebClient": true
 *                             },
 *                             {
 *                                 "token": "*****",
 *                                 "generateAt": 1712749833891,
 *                                 "isWebClient": true
 *                             },
 *                             {
 *                                 "token": "*****",
 *                                 "generateAt": 1716557275822,
 *                                 "isWebClient": false
 *                             }
 *                         ],
 *                         "lastUpdate": 1717752949497
 *                     }
 *                 ],
 *                 "bankAccounts": [
 *                     {
 *                         "merchantCode": "17642555",
 *                         "name": "Global",
 *                         "accountNumber": "4111111111111111",
 *                         "code": "",
 *                         "selected": true,
 *                         "lightningUserName": "17642555",
 *                         "lightningAddress": "17642555@v2.flom.dev",
 *                         "lightningUrlEncoded": "LNURL1DP68GURN8GHJ7A3J9ENXCMMD9EJX2A309EMK2MRV944KUMMHDCHKCMN4WFK8QTE3XUMRGV34X56S3ZC8LY"
 *                     }
 *                 ],
 *                 "location": {
 *                     "type": "Point",
 *                     "coordinates": [
 *                         15.955504,
 *                         45.803989
 *                     ]
 *                 },
 *                 "isAppUser": true,
 *                 "flomAgentId": null,
 *                 "newUserNotificationSent": true,
 *                 "followedBusinesses": [
 *                     "63e10fd117885e15aa47be24",
 *                     "63dcc816bcc5921af87df5c5",
 *                     "6411b7a1b0f73c5f0fcce686",
 *                     "63dccc42bcc5921af87df5ce",
 *                     "63ebd90e3ad20c240227fc9d",
 *                     "6401d5ba13bdab115bb8da85"
 *                 ],
 *                 "likedProducts": [],
 *                 "recentlyViewedProducts": [
 *                     "63ef52f74e7a3c1668dd8617",
 *                     "66337295f46e8b54e8feb0aa",
 *                     "6554f6954fbc414ea5ea2bf8",
 *                     "63edeafcb4846e6230f4f51f",
 *                     "64f1d56d202e1976fd1c7d28",
 *                     "65854878230a2b39c5666c94",
 *                     "6597f21f1533a2f45dc8f64f",
 *                     "65e18cecdde73a96a618c401",
 *                     "64edc35c7d1bbd683855b9bc",
 *                     "65815f1c3909f5396f5f0a0e"
 *                 ],
 *                 "createdBusinessInFlom": false,
 *                 "onAnotherDevice": false,
 *                 "shadow": false,
 *                 "isDeleted": {
 *                     "value": false,
 *                     "created": 1675422038224
 *                 },
 *                 "blockedProducts": 0,
 *                 "memberships": [
 *                     {
 *                         "id": "66221c5cac62e62b5312bdb9",
 *                         "creatorId": "66221037ff296614518456a2",
 *                         "expirationDate": -1,
 *                         "startDate": -1
 *                     },
 *                     {
 *                         "id": "663b2c6698b55a6b60cb066b",
 *                         "creatorId": "63e10fd117885e15aa47be24",
 *                         "expirationDate": 1717196400000,
 *                         "startDate": -1
 *                     },
 *                     {
 *                         "id": "6504122a7019b571ac08c9b6",
 *                         "creatorId": "63e10fd117885e15aa47be24",
 *                         "expirationDate": -1,
 *                         "startDate": 1717203600000
 *                     },
 *                     {
 *                         "id": "63e0fb88fdd26757f0940ceb",
 *                         "creatorId": "63dceca0c30542684f1b7b68",
 *                         "expirationDate": 1717196400000,
 *                         "startDate": -1
 *                     },
 *                     {
 *                         "id": "63e0f8b2fdd26757f0940ce3",
 *                         "creatorId": "63dceca0c30542684f1b7b68",
 *                         "expirationDate": -1,
 *                         "startDate": 1717203600000
 *                     }
 *                 ],
 *                 "socialMedia": [],
 *                 "isCreator": true,
 *                 "isSeller": true,
 *                 "phoneNumberStatus": 3,
 *                 "payoutFrequency": 5,
 *                 "lastPayoutDate": 0,
 *                 "merchantApplicationStatus": 3,
 *                 "locationVisibility": false,
 *                 "creditBalance": 2419,
 *                 "name": "ivoperic",
 *                 "organizationId": "5caf3119ec0abb18999bd753",
 *                 "status": 1,
 *                 "created": 1675422038225,
 *                 "phoneNumber": "+385976376676",
 *                 "userName": "ivoperic",
 *                 "invitationUri": "https://qrios.page.link/zQ5rzS6ed2XeZ35P8",
 *                 "activationCode": null,
 *                 "__v": 58,
 *                 "typeAcc": 1,
 *                 "cover": {
 *                     "banner": {
 *                         "file": {
 *                             "originalName": "cropped1077324777086839160.jpg",
 *                             "nameOnServer": "v2OoC52g0lsnbw0tdAbCeydGDf7ljzKG.jpg",
 *                             "width": 1802,
 *                             "height": 600,
 *                             "size": 130060,
 *                             "mimeType": "image/jpeg",
 *                             "aspectRatio": 3.00333
 *                         },
 *                         "fileType": 0,
 *                         "thumb": {
 *                             "originalName": "cropped1077324777086839160.jpg",
 *                             "nameOnServer": "GZifZ224eAwXN4bYjTzdHADnYCkzkCEo.jpg",
 *                             "mimeType": "image/jpeg",
 *                             "size": 132000
 *                         }
 *                     },
 *                     "video": {
 *                         "file": {
 *                             "originalName": "2023-09-12-15-24-57-594.mp4",
 *                             "nameOnServer": "J0GhlXdkj6UL6ickn3oqOSEL4CTXOIGq.mp4",
 *                             "width": 640,
 *                             "height": 480,
 *                             "aspectRatio": 0.75,
 *                             "duration": 1.2,
 *                             "mimeType": "video/mp4",
 *                             "size": 160166,
 *                             "hslName": "XdroZmum5czZTVq3PdyLFw3k3xjiPmDP"
 *                         },
 *                         "fileType": 1,
 *                         "thumb": {
 *                             "originalName": "2023-09-12-15-24-57-594.mp4",
 *                             "nameOnServer": "pSksO77c7pC4lnnJT5iYyyE2EwZaz9Tn.jpg",
 *                             "mimeType": "image/jpeg",
 *                             "size": 50773
 *                         }
 *                     },
 *                     "audio": {
 *                         "file": {
 *                             "originalName": "CA0AF15F-4463-4265-A99B-E3284AF6A54F.aac",
 *                             "nameOnServer": "dRf0EYxCMX0ZnYhhLbzhtE2V4uwDXADn.mp3",
 *                             "mimeType": "audio/mpeg",
 *                             "duration": 2.533878,
 *                             "size": 40795,
 *                             "hslName": "t6OK894BRt7ilBQhA1hQxJ2wqf4XYox3"
 *                         },
 *                         "fileType": 2
 *                     }
 *                 },
 *                 "description": "jvhv",
 *                 "deletedUserInfo": {
 *                     "bankAccounts": []
 *                 },
 *                 "merchantDOB": "1381993",
 *                 "businessCategory": {
 *                     "_id": "621e439d616885d34f101eca",
 *                     "name": "Digital Goods"
 *                 },
 *                 "categoryBusinessId": "621e439d616885d34f101eca",
 *                 "workingHours": {
 *                     "start": "2",
 *                     "end": "5"
 *                 },
 *                 "countryCode": "HR",
 *                 "deviceType": "android",
 *                 "dateOfBirth": 529327693000,
 *                 "kidsMode": false,
 *                 "satsBalance": 498,
 *                 "socialMediaLinks": [],
 *                 "hasLoggedIn": 1,
 *                 "lightningUserName": "ivopp",
 *                 "lightningUrlEncoded": "LNURL1DP68GURN8GHJ7A3J9ENXCMMD9EJX2A309EMK2MRV944KUMMHDCHKCMN4WFK8QTMFWEHHQUQSJR4WC",
 *                 "lightningInfo": [
 *                     {
 *                         "userName": "dysedm2l",
 *                         "address": "dysedm2l@v2.flom.dev",
 *                         "encodedUrl": "LNURL1DP68GURN8GHJ7A3J9ENXCMMD9EJX2A309EMK2MRV944KUMMHDCHKCMN4WFK8QTMY09EK2ERDXFKQJX7A7Y"
 *                     },
 *                     {
 *                         "userName": "ivopp",
 *                         "address": "ivopp@v2.flom.dev",
 *                         "encodedUrl": "LNURL1DP68GURN8GHJ7A3J9ENXCMMD9EJX2A309EMK2MRV944KUMMHDCHKCMN4WFK8QTMFWEHHQUQSJR4WC"
 *                     }
 *                 ],
 *                 "aboutBusiness": "",
 *                 "hasChangedLnUserName": true,
 *                 "email": "cicjgjc",
 *                 "modified": 1709284701039,
 *                 "lastLogin": 1717752924218,
 *                 "currency": "EUR",
 *                 "avatar": {
 *                     "picture": {
 *                         "originalName": "imageA_1705559328.jpg",
 *                         "size": 1024276,
 *                         "mimeType": "image/png",
 *                         "nameOnServer": "WWhFE3HPFfpzRm32Ili2OKMOU3qeU6Gg"
 *                     },
 *                     "thumbnail": {
 *                         "originalName": "imageA_1705559328.jpg",
 *                         "size": 92122,
 *                         "mimeType": "image/png",
 *                         "nameOnServer": "aKZQoxdnrCgnS5W4zeQ1S4eiN6C1pmXV"
 *                     }
 *                 },
 *                 "nigerianBankAccounts": [],
 *                 "groupModels": [],
 *                 "organization": {
 *                     "_id": "5caf3119ec0abb18999bd753",
 *                     "name": "flomorg",
 *                     "organizationId": "flomorg"
 *                 },
 *                 "onlineStatus": null,
 *                 "productsCount": 6,
 *                 "lightningAddress": "ivopp@v2.flom.dev",
 *                 "soldProductsCount": 8,
 *                 "subscribersCount": 3,
 *                 "creatorMemberships": [
 *                     {
 *                         "_id": "650173227019b571ac08c6e4",
 *                         "recurringPaymentType": 1,
 *                         "benefits": [
 *                             {
 *                                 "type": 1,
 *                                 "title": "Group chat",
 *                                 "enabled": true
 *                             },
 *                             {
 *                                 "type": 2,
 *                                 "title": "Private messaging",
 *                                 "enabled": true
 *                             },
 *                             {
 *                                 "type": 3,
 *                                 "title": "Video call",
 *                                 "enabled": true
 *                             },
 *                             {
 *                                 "type": 4,
 *                                 "title": "Audio call",
 *                                 "enabled": true
 *                             },
 *                             {
 *                                 "type": 5,
 *                                 "title": "Content description",
 *                                 "enabled": true
 *                             },
 *                             {
 *                                 "type": 6,
 *                                 "title": "Go live",
 *                                 "enabled": true
 *                             }
 *                         ],
 *                         "image": {
 *                             "originalName": "IMAGE_20230913_103026.jpg",
 *                             "size": 31362,
 *                             "mimeType": "image/jpeg",
 *                             "nameOnServer": "upload_5f51f3abb4386998c2e53dec91453b41",
 *                             "link": "/shared/actions-runner/_work/Roja_Server/Roja_Server/public/uploads/upload_5f51f3abb4386998c2e53dec91453b41",
 *                             "thumbnailName": "thumb_5f51f3abb4386998c2e53dec91453b41"
 *                         },
 *                         "created": 1694593826516,
 *                         "deleted": false,
 *                         "name": "tetst",
 *                         "amount": 10,
 *                         "description": "opisujem",
 *                         "order": 1,
 *                         "creatorId": "63dce956c30542684f1b7b63",
 *                         "__v": 0
 *                     },
 *                     {
 *                         "_id": "6502d9ba7019b571ac08c931",
 *                         "recurringPaymentType": 1,
 *                         "benefits": [
 *                             {
 *                                 "type": 1,
 *                                 "title": "Group chat",
 *                                 "enabled": true
 *                             },
 *                             {
 *                                 "type": 2,
 *                                 "title": "Private messaging",
 *                                 "enabled": true
 *                             },
 *                             {
 *                                 "type": 3,
 *                                 "title": "Video call",
 *                                 "enabled": true
 *                             },
 *                             {
 *                                 "type": 4,
 *                                 "title": "Audio call",
 *                                 "enabled": false
 *                             },
 *                             {
 *                                 "type": 5,
 *                                 "title": "Content description",
 *                                 "enabled": true
 *                             },
 *                             {
 *                                 "type": 6,
 *                                 "title": "Go live",
 *                                 "enabled": false
 *                             }
 *                         ],
 *                         "created": 1694685626403,
 *                         "deleted": false,
 *                         "name": "jeftiniaaa",
 *                         "amount": 1,
 *                         "description": "opisujem",
 *                         "order": 2,
 *                         "creatorId": "63dce956c30542684f1b7b63",
 *                         "__v": 0
 *                     }
 *                 ],
 *                 "membersCount": 0,
 *                 "hasReceivedFundsWithoutMerchantCode": false
 *             }
 *         ],
 *         "paginationData": {
 *             "page": 1,
 *             "size": 10,
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
 * @apiError (Errors) 4000007 Token invalid
 */

router.get("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const userId = user._id.toString();
    const token = request.headers["access-token"];
    const { page: p, size: s, search: searchTerm } = request.query;
    const page = !p ? 1 : +p;
    const size = !s ? Const.newPagingRows : +s;

    const memberships = await Membership.find({ creatorId: userId }).lean();
    const communityIds = memberships.map((community) => community._id.toString());

    const query = { "memberships.id": { $in: communityIds } };
    if (searchTerm) {
      const regex = new RegExp(searchTerm, "i");
      query.userName = regex;
    }

    const members = await User.find(query).lean();

    const filteredMembers = members.filter((member) => {
      const memberships = member.memberships;

      for (const membership of memberships) {
        if (
          communityIds.includes(membership.id) &&
          (membership.expirationDate === -1 || membership.expirationDate < Date.now())
        ) {
          return true;
        }
      }

      return false;
    });

    for (let i = 0; i < filteredMembers.length; i++) {
      if (!filteredMembers[i]) continue;
      await formatUserDetailsResponse({ user: filteredMembers[i], requestAccessToken: token });
    }

    const total = filteredMembers.length;
    const hasNext = page * size < total;

    const paginatedMembers =
      total === 0 ? [] : filteredMembers.slice((page - 1) * size, (page - 1) * size + size);

    const responseData = {
      members: paginatedMembers,
      paginationData: { page, size, total, hasNext },
    };
    Base.successResponse(response, Const.responsecodeSucceed, responseData);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "GetAllMembersOfUsersCommunitiesController",
      error,
    });
  }
});

module.exports = router;
