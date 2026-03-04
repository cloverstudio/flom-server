"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const Utils = require("#utils");
const { LiveStream } = require("#models");
const { formatLiveStreamResponse } = require("#logics");

/**
 * @api {get} /api/v2/user/livestream/:userId Get users active live stream flom_v1
 * @apiVersion 2.0.21
 * @apiName  Get users active live stream flom_v1
 * @apiGroup WebAPI User
 * @apiDescription  Get users active live stream.
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1711010802918,
 *     "data": {
 *         "liveStream": {
 *             "_id": "65fbf300637fa90fc8b3fe1e",
 *             "tribeIds": [],
 *             "membershipIds": [],
 *             "totalNumberOfViews": 0,
 *             "created": 1711010560536,
 *             "userId": "63ebd90e3ad20c240227fc9d",
 *             "name": "Pero's first stream",
 *             "type": "live",
 *             "visibility": "public",
 *             "__v": 0,
 *             "modified": 1711010657475,
 *             "streamId": "fakestreamid1234",
 *             "tags": "#kitchen #goodfood #garlic",
 *             "tagIds": ["tag_id_1", "tag_id_2", "tag_id_3"],
 *             "allowComments": true,
 *             "allowSuperBless": false,
 *             "allowSprayBless": false,
 *             "cohosts": [
 *                 {
 *                     "_id": "63dcc7f3bcc5921af87df5c2",
 *                     "bankAccounts": [
 *                         {
 *                             "merchantCode": "40200168",
 *                             "name": "SampleAcc",
 *                             "accountNumber": "1503567574679",
 *                             "code": "",
 *                             "selected": true,
 *                             "lightningUserName": "40200168",
 *                             "lightningAddress": "40200168@v2.flom.dev",
 *                             "lightningUrlEncoded": "LNURL1DP68GURN8GHJ7A3J9ENXCMMD9EJX2A309EMK2MRV944KUMMHDCHKCMN4WFK8QTE5XQERQVP3XCUQXZ6U2G"
 *                         }
 *                     ],
 *                     "created": 1675413491799,
 *                     "phoneNumber": "+2348020000004",
 *                     "userName": "marko_04",
 *                     "avatar": {
 *                         "picture": {
 *                             "originalName": "IMAGE_20230210_114832.jpg",
 *                             "size": 71831,
 *                             "mimeType": "image/png",
 *                             "nameOnServer": "9LAr5TWlzCGxSeomwLEd3VR7YdiCZ14H"
 *                         },
 *                         "thumbnail": {
 *                             "originalName": "IMAGE_20230210_114832.jpg",
 *                             "size": 59100,
 *                             "mimeType": "image/png",
 *                             "nameOnServer": "PM4qH75xRcMMcfgKo9kwLtH5UPs5FE0g"
 *                         }
 *                     }
 *                 }
 *             ],
 *             "user": {
 *                 "_id": "63ebd90e3ad20c240227fc9d",
 *                 "created": 1675671804461,
 *                 "phoneNumber": "+2348037164622",
 *                 "userName": "mosh",
 *                 "avatar": {
 *                     "picture": {
 *                         "originalName": "IMAGE_20230210_114832.jpg",
 *                         "size": 71831,
 *                         "mimeType": "image/png",
 *                         "nameOnServer": "9LAr5TWlzCGxSeomwLEd3VR7YdiCZ14H"
 *                     },
 *                     "thumbnail": {
 *                         "originalName": "IMAGE_20230210_114832.jpg",
 *                         "size": 59100,
 *                         "mimeType": "image/png",
 *                         "nameOnServer": "PM4qH75xRcMMcfgKo9kwLtH5UPs5FE0g"
 *                     }
 *                 },
 *                 "bankAccounts": [
 *                     {
 *                         "merchantCode": "89440483",
 *                         "businessName": "DIGITAL",
 *                         "name": "DIGITAL",
 *                         "bankName": "FBN MOBILE",
 *                         "code": "309",
 *                         "accountNumber": "jgrdguhfbtf",
 *                         "selected": true,
 *                         "lightningUserName": "89440483",
 *                         "lightningAddress": "89440483@v2.flom.dev",
 *                         "lightningUrlEncoded": "LNURL1DP68GURN8GHJ7A3J9ENXCMMD9EJX2A309EMK2MRV944KUMMHDCHKCMN4WFK8QTEC8Y6RGVP58QESA403RS"
 *                     },
 *                     {
 *                         "merchantCode": "89440477",
 *                         "businessName": null,
 *                         "name": null,
 *                         "bankName": "FBN",
 *                         "code": "011",
 *                         "accountNumber": null,
 *                         "selected": false,
 *                         "lightningUserName": "89440477",
 *                         "lightningAddress": "89440477@v2.flom.dev",
 *                         "lightningUrlEncoded": "LNURL1DP68GURN8GHJ7A3J9ENXCMMD9EJX2A309EMK2MRV944KUMMHDCHKCMN4WFK8QTEC8Y6RGVP5XUMSRMD43Z"
 *                     }
 *                 ]
 *             }
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
 * @apiError (Errors) 443230 Invalid user id
 * @apiError (Errors) 443040 User not found
 * @apiError (Errors) 443855 Live stream not found
 * @apiError (Errors) 443902 No active live stream found for user
 * @apiError (Errors) 4000007 Token invalid
 */

router.get("/:userId", auth({ allowUser: true }), async function (request, response) {
  try {
    const { userId } = request.params;

    if (!userId || !Utils.isValidObjectId(userId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidUserId,
        message: "GetUsersActiveLiveStreamController, invalid user id",
      });
    }

    const liveStreams = await LiveStream.find({ userId, isActive: true })
      .sort({ created: -1 })
      .lean();

    if (!liveStreams || liveStreams.length === 0) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoActiveLiveStreamFoundForUser,
        message: "GetUsersActiveLiveStreamController, active live stream not found for user",
      });
    }
    const liveStream = liveStreams[0];

    await formatLiveStreamResponse({ liveStream });

    const responseData = { liveStream };
    Base.successResponse(response, Const.responsecodeSucceed, responseData);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "GetUsersActiveLiveStreamController",
      error,
    });
  }
});

module.exports = router;
