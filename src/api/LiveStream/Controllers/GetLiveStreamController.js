"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { LiveStream, User, Tribe, Membership } = require("#models");
const { formatLiveStreamResponse } = require("#logics");
const { recombee } = require("#services");
const { Types } = require("mongoose");

/**
 * @api {get} /api/v2/livestreams/list Get a list of live streams flom_v1
 * @apiVersion 2.0.19
 * @apiName  Get a list of live streams flom_v1
 * @apiGroup WebAPI Live Stream
 * @apiDescription  Get a list of live streams
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiParam (Query string) {String}  [page]       Page number
 * @apiParam (Query string) {String}  [size]       Page size
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1711010747020,
 *     "data": {
 *         "liveStreams": [
 *             {
 *                 "_id": "65fbf300637fa90fc8b3fe1e",
 *                 "tribeIds": [],
 *                 "communityIds": [],
 *                 "totalNumberOfViews": 0,
 *                 "created": 1711010560536,
 *                 "userId": "63ebd90e3ad20c240227fc9d",
 *                 "name": "Pero's first stream",
 *                 "type": "live",
 *                 "visibility": "public",
 *                 "__v": 0,
 *                 "modified": 1711010657475,
 *                 "streamId": "fakestreamid1234",
 *                 "tags": "kitchen goodfood garlic",
 *                 "tagIds": ["tag_id_1", "tag_id_2", "tag_id_3"],
 *                 "cohosts": [
 *                     {
 *                         "_id": "63dcc7f3bcc5921af87df5c2",
 *                         "bankAccounts": [
 *                             {
 *                                 "merchantCode": "40200168",
 *                                 "name": "SampleAcc",
 *                                 "accountNumber": "1503567574679",
 *                                 "code": "",
 *                                 "selected": true,
 *                                 "lightningUserName": "40200168",
 *                                 "lightningAddress": "40200168@v2.flom.dev",
 *                                 "lightningUrlEncoded": "LNURL1DP68GURN8GHJ7A3J9ENXCMMD9EJX2A309EMK2MRV944KUMMHDCHKCMN4WFK8QTE5XQERQVP3XCUQXZ6U2G"
 *                             }
 *                         ],
 *                         "created": 1675413491799,
 *                         "phoneNumber": "+2348020000004",
 *                         "userName": "marko_04",
 *                         "avatar": {
 *                             "picture": {
 *                                 "originalName": "IMAGE_20230210_114832.jpg",
 *                                 "size": 71831,
 *                                 "mimeType": "image/png",
 *                                 "nameOnServer": "9LAr5TWlzCGxSeomwLEd3VR7YdiCZ14H"
 *                             },
 *                             "thumbnail": {
 *                                 "originalName": "IMAGE_20230210_114832.jpg",
 *                                 "size": 59100,
 *                                 "mimeType": "image/png",
 *                                 "nameOnServer": "PM4qH75xRcMMcfgKo9kwLtH5UPs5FE0g"
 *                             }
 *                         }
 *                     }
 *                 ],
 *                 "user": {
 *                     "_id": "63ebd90e3ad20c240227fc9d",
 *                     "created": 1675671804461,
 *                     "phoneNumber": "+2348037164622",
 *                     "userName": "mosh",
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
 *                     },
 *                     "bankAccounts": [
 *                         {
 *                             "merchantCode": "89440483",
 *                             "businessName": "DIGITAL",
 *                             "name": "DIGITAL",
 *                             "bankName": "FBN MOBILE",
 *                             "code": "309",
 *                             "accountNumber": "jgrdguhfbtf",
 *                             "selected": true,
 *                             "lightningUserName": "89440483",
 *                             "lightningAddress": "89440483@v2.flom.dev",
 *                             "lightningUrlEncoded": "LNURL1DP68GURN8GHJ7A3J9ENXCMMD9EJX2A309EMK2MRV944KUMMHDCHKCMN4WFK8QTEC8Y6RGVP58QESA403RS"
 *                         },
 *                         {
 *                             "merchantCode": "89440477",
 *                             "businessName": null,
 *                             "name": null,
 *                             "bankName": "FBN",
 *                             "code": "011",
 *                             "accountNumber": null,
 *                             "selected": false,
 *                             "lightningUserName": "89440477",
 *                             "lightningAddress": "89440477@v2.flom.dev",
 *                             "lightningUrlEncoded": "LNURL1DP68GURN8GHJ7A3J9ENXCMMD9EJX2A309EMK2MRV944KUMMHDCHKCMN4WFK8QTEC8Y6RGVP5XUMSRMD43Z"
 *                         }
 *                     ],
 *                     "creatorMemberships": [
 *                         {
 *                             "_id": "6655c0039d6200e057c532ca",
 *                             "recurringPaymentType": 1,
 *                             "benefits": [
 *                                 {
 *                                     "type": 1,
 *                                     "title": "Group chat",
 *                                     "enabled": true
 *                                 }
 *                             ],
 *                             "created": 1716895747171,
 *                             "deleted": false,
 *                             "name": "first",
 *                             "amount": 5,
 *                             "description": "gff qff to DC",
 *                             "order": 1,
 *                             "creatorId": "64522d0ce8032549d6f9abba",
 *                             "__v": 0
 *                         }
 *                     ]
 *                 }
 *             }
 *         ],
 *         "paginationData": {
 *             "page": 1,
 *             "size": 10,
 *             "total": 0,
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

router.get("/list", auth({ allowUser: true }), async function (request, response) {
  try {
    const userId = request.user._id.toString();
    const { page: p, size: s } = request.query;

    const page = !p ? 1 : +p;
    const size = !s ? Const.newPagingRows : +s;

    const blocked = request.user?.blocked || [];
    const age = !request.user?.dateOfBirth ? 1 : Utils.yearsFromBirthDate(request.user.dateOfBirth);

    const liveStreams = await LiveStream.aggregate([
      {
        $match: {
          isActive: true,
          userId: { $nin: [...blocked, userId] },
          ...(age < 18 ? { appropriateForKids: true } : {}),
        },
      },
      { $sort: { created: -1 } },
      { $group: { _id: "$userId", doc: { $first: "$$ROOT" } } },
      { $replaceRoot: { newRoot: "$doc" } },
      { $project: { comments: 0 } },
      { $skip: size * (page - 1) },
      { $limit: size },
    ]);

    for (const stream of liveStreams) {
      await formatLiveStreamResponse({ liveStream: stream });
    }

    const total = await LiveStream.countDocuments({
      isActive: true,
      userId: { $nin: [...blocked, userId] },
      ...(age < 18 ? { appropriateForKids: true } : {}),
    });

    const hasNext = page * size < total;
    const paginationData = { page, size, total, hasNext };

    const responseData = { liveStreams, paginationData };
    Base.successResponse(response, Const.responsecodeSucceed, responseData);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "GetLiveStreamController, GET list",
      error,
    });
  }
});

/**
 * @api {get} /api/v2/livestreams/recommended Get a list of recommended live streams flom_v1
 * @apiVersion 2.0.30
 * @apiName  Get a list of recommended live streams flom_v1
 * @apiGroup WebAPI Live Stream
 * @apiDescription  Get a list of live streams recommended by recombee. First request should be sent without recommId, which is returned in response. Subsequent requests should be sent with recommId to get personalized recommendations. Returns 10 streams per request.
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiParam (Query string) {String} [recommId] RecommId from recombee
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1711010747020,
 *     "data": {
 *         "recommId": "some-recomm-id-string",
 *         "liveStreams": [
 *             {
 *                 "_id": "65fbf300637fa90fc8b3fe1e",
 *                 "tribeIds": [],
 *                 "communityIds": [],
 *                 "totalNumberOfViews": 0,
 *                 "created": 1711010560536,
 *                 "userId": "63ebd90e3ad20c240227fc9d",
 *                 "name": "Pero's first stream",
 *                 "type": "live",
 *                 "visibility": "public",
 *                 "__v": 0,
 *                 "modified": 1711010657475,
 *                 "streamId": "fakestreamid1234",
 *                 "tags": "kitchen goodfood garlic",
 *                 "tagIds": ["tag_id_1", "tag_id_2", "tag_id_3"],
 *                 "cohosts": [
 *                     {
 *                         "_id": "63dcc7f3bcc5921af87df5c2",
 *                         "bankAccounts": [
 *                             {
 *                                 "merchantCode": "40200168",
 *                                 "name": "SampleAcc",
 *                                 "accountNumber": "1503567574679",
 *                                 "code": "",
 *                                 "selected": true,
 *                                 "lightningUserName": "40200168",
 *                                 "lightningAddress": "40200168@v2.flom.dev",
 *                                 "lightningUrlEncoded": "LNURL1DP68GURN8GHJ7A3J9ENXCMMD9EJX2A309EMK2MRV944KUMMHDCHKCMN4WFK8QTE5XQERQVP3XCUQXZ6U2G"
 *                             }
 *                         ],
 *                         "created": 1675413491799,
 *                         "phoneNumber": "+2348020000004",
 *                         "userName": "marko_04",
 *                         "avatar": {
 *                             "picture": {
 *                                 "originalName": "IMAGE_20230210_114832.jpg",
 *                                 "size": 71831,
 *                                 "mimeType": "image/png",
 *                                 "nameOnServer": "9LAr5TWlzCGxSeomwLEd3VR7YdiCZ14H"
 *                             },
 *                             "thumbnail": {
 *                                 "originalName": "IMAGE_20230210_114832.jpg",
 *                                 "size": 59100,
 *                                 "mimeType": "image/png",
 *                                 "nameOnServer": "PM4qH75xRcMMcfgKo9kwLtH5UPs5FE0g"
 *                             }
 *                         }
 *                     }
 *                 ],
 *                 "user": {
 *                     "_id": "63ebd90e3ad20c240227fc9d",
 *                     "created": 1675671804461,
 *                     "phoneNumber": "+2348037164622",
 *                     "userName": "mosh",
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
 *                     },
 *                     "bankAccounts": [
 *                         {
 *                             "merchantCode": "89440483",
 *                             "businessName": "DIGITAL",
 *                             "name": "DIGITAL",
 *                             "bankName": "FBN MOBILE",
 *                             "code": "309",
 *                             "accountNumber": "jgrdguhfbtf",
 *                             "selected": true,
 *                             "lightningUserName": "89440483",
 *                             "lightningAddress": "89440483@v2.flom.dev",
 *                             "lightningUrlEncoded": "LNURL1DP68GURN8GHJ7A3J9ENXCMMD9EJX2A309EMK2MRV944KUMMHDCHKCMN4WFK8QTEC8Y6RGVP58QESA403RS"
 *                         },
 *                         {
 *                             "merchantCode": "89440477",
 *                             "businessName": null,
 *                             "name": null,
 *                             "bankName": "FBN",
 *                             "code": "011",
 *                             "accountNumber": null,
 *                             "selected": false,
 *                             "lightningUserName": "89440477",
 *                             "lightningAddress": "89440477@v2.flom.dev",
 *                             "lightningUrlEncoded": "LNURL1DP68GURN8GHJ7A3J9ENXCMMD9EJX2A309EMK2MRV944KUMMHDCHKCMN4WFK8QTEC8Y6RGVP5XUMSRMD43Z"
 *                         }
 *                     ],
 *                     "creatorMemberships": [
 *                         {
 *                             "_id": "6655c0039d6200e057c532ca",
 *                             "recurringPaymentType": 1,
 *                             "benefits": [
 *                                 {
 *                                     "type": 1,
 *                                     "title": "Group chat",
 *                                     "enabled": true
 *                                 }
 *                             ],
 *                             "created": 1716895747171,
 *                             "deleted": false,
 *                             "name": "first",
 *                             "amount": 5,
 *                             "description": "gff qff to DC",
 *                             "order": 1,
 *                             "creatorId": "64522d0ce8032549d6f9abba",
 *                             "__v": 0
 *                         }
 *                     ]
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
 *
 * @apiError (Errors) 4000007 Token invalid
 */

router.get("/recommended", auth({ allowUser: true }), async function (request, response) {
  try {
    const user = request.user;
    const userId = user._id.toString();
    const recommId = request.query.recommId || null;

    let recombeeResponse;

    if (!recommId) {
      const distanceToUser = `earth_distance('latitude', 'longitude', context_user["latitude"], context_user["longitude"])`;
      const hasValidCoordinates = "'longitude' != 0 and 'latitude' != 0";

      const blocked = user.blocked || [];
      const age = !user.dateOfBirth ? 1 : Utils.yearsFromBirthDate(user.dateOfBirth);

      const ageFilter = age < 18 || user.kidsMode ? "'appropriateForKids' == true" : null;
      const blockedFilter =
        blocked.length > 0
          ? `'ownerId' not in {${blocked.map((id) => `"${id}"`).join(", ")}}`
          : null;
      const filter = [`'itemType' == "Live Stream"`, blockedFilter, ageFilter]
        .filter((q) => q !== null)
        .join(" and ");

      const now = Math.floor(Date.now() / 1000);
      let booster = `1.0 * (1.0 + 0.1 * size(select(lambda 'x': 'x' in  context_user["preferredTags"], 'tags'))) * (1.0 + 0.1 * size(select(lambda 'x': 'x' in  context_user["preferredTags"], 'linkedProductTags')))`;
      booster += ` * (if ${hasValidCoordinates} then (if ${distanceToUser} < 100000 then 1.25 else 1) else (if 'countryCode' == context_user["countryCode"] then 1.25 else 0.75))`;
      booster += ` * (if ((${now} - 'startTime') / 3600) < 3 then 2.0 else 1.0)`;

      recombeeResponse = await recombee.getRecommendations({
        userId,
        count: Const.newPagingRows,
        scenario: "live",
        filter,
        booster,
      });
    } else {
      recombeeResponse = await recombee.getNextRecommendations({
        recommId,
        count: Const.newPagingRows,
      });
    }

    const recommendedProductIds = recombeeResponse.recomms.map((item) => {
      const stringId = `${item.id.replace("l_", "")}`;
      return new Types.ObjectId(stringId);
    });
    const newRecommId = recombeeResponse.recommId;

    const liveStreams = await LiveStream.aggregate([
      { $match: { _id: { $in: recommendedProductIds } } },
      { $sort: { userId: 1, created: -1 } },
      { $group: { _id: "$userId", doc: { $first: "$$ROOT" } } },
      { $replaceRoot: { newRoot: "$doc" } },
      { $project: { comments: 0 } },
      { $sort: { created: -1 } },
    ]);

    for (const stream of liveStreams) {
      await formatLiveStreamResponse({ liveStream: stream });
    }

    const responseData = { liveStreams, recommId: newRecommId };
    Base.successResponse(response, Const.responsecodeSucceed, responseData);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "GetLiveStreamController, GET recommended",
      error,
    });
  }
});

/**
 * @api {get} /api/v2/livestreams/streamId/:streamId Get live stream by antmedia stream id flom_v1
 * @apiVersion 2.0.19
 * @apiName  Get live stream by antmedia stream id flom_v1
 * @apiGroup WebAPI Live Stream
 * @apiDescription  Get live stream by antmedia stream id
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiParam (Query string) {String} [recommId] recommId for recombee tracking
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1711010802918,
 *     "data": {
 *         "liveStream": {
 *             "_id": "65fbf300637fa90fc8b3fe1e",
 *             "tribeIds": [],
 *             "communityIds": [],
 *             "totalNumberOfViews": 0,
 *             "created": 1711010560536,
 *             "userId": "63ebd90e3ad20c240227fc9d",
 *             "name": "Pero's first stream",
 *             "type": "live",
 *             "visibility": "public",
 *             "__v": 0,
 *             "modified": 1711010657475,
 *             "streamId": "fakestreamid1234",
 *             "tags": "kitchen goodfood garlic",
 *             "tagIds": ["tag_id_1", "tag_id_2", "tag_id_3"],
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
 *                 ],
 *                 "creatorMemberships": [
 *                     {
 *                         "_id": "6655c0039d6200e057c532ca",
 *                         "recurringPaymentType": 1,
 *                         "benefits": [
 *                             {
 *                                 "type": 1,
 *                                 "title": "Group chat",
 *                                 "enabled": true
 *                             }
 *                         ],
 *                         "created": 1716895747171,
 *                         "deleted": false,
 *                         "name": "first",
 *                         "amount": 5,
 *                         "description": "gff qff to DC",
 *                         "order": 1,
 *                         "creatorId": "64522d0ce8032549d6f9abba",
 *                         "__v": 0
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
 * @apiError (Errors) 443855 Live stream not found
 * @apiError (Errors) 443858 User not allowed
 * @apiError (Errors) 4000007 Token invalid
 */

router.get("/streamid/:streamId", auth({ allowUser: true }), async function (request, response) {
  try {
    const { streamId } = request.params;
    const { recommId = null } = request.query;
    const { user } = request;
    const blocked = user.blocked || [];
    const age = !user?.dateOfBirth ? 1 : Utils.yearsFromBirthDate(user.dateOfBirth);

    const liveStream = await LiveStream.findOne(
      { streamId, ...(age < 18 ? { appropriateForKids: true } : {}) },
      { comments: 0 },
    ).lean();

    if (!liveStream || blocked.includes(liveStream.userId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeLiveStreamNotFound,
        message: "GetLiveStreamController, GET by streamid - live stream not found",
      });
    }

    if (!(await isUserAllowed({ liveStream, userId: user._id.toString() }))) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNotAllowed,
        message: "GetLiveStreamController, GET by streamid - user not allowed",
      });
    }

    await formatLiveStreamResponse({ liveStream });

    const responseData = { liveStream };
    Base.successResponse(response, Const.responsecodeSucceed, responseData);

    try {
      await recombee.recordInteraction({
        user,
        liveStream,
        type: "view",
        ...(recommId && { recommId }),
      });
    } catch (error) {
      logger.error("GetLiveStreamController, GET by streamid, recombee error: ", error);
    }
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "GetLiveStreamController, GET by streamid",
      error,
    });
  }
});

/**
 * @api {get} /api/v2/livestreams/:id Get live stream by id flom_v1
 * @apiVersion 2.0.19
 * @apiName  Get live stream by id flom_v1
 * @apiGroup WebAPI Live Stream
 * @apiDescription  Get live stream by database id
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiParam (Query string) {String} [recommId] recommId for recombee tracking
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1711010802918,
 *     "data": {
 *         "liveStream": {
 *             "_id": "65fbf300637fa90fc8b3fe1e",
 *             "tribeIds": [],
 *             "communityIds": [],
 *             "totalNumberOfViews": 0,
 *             "created": 1711010560536,
 *             "userId": "63ebd90e3ad20c240227fc9d",
 *             "name": "Pero's first stream",
 *             "type": "live",
 *             "visibility": "public",
 *             "__v": 0,
 *             "modified": 1711010657475,
 *             "streamId": "fakestreamid1234",
 *             "tags": "kitchen goodfood garlic",
 *             "tagIds": ["tag_id_1", "tag_id_2", "tag_id_3"],
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
 *                 ],
 *                 "creatorMemberships": [
 *                     {
 *                         "_id": "6655c0039d6200e057c532ca",
 *                         "recurringPaymentType": 1,
 *                         "benefits": [
 *                             {
 *                                 "type": 1,
 *                                 "title": "Group chat",
 *                                 "enabled": true
 *                             }
 *                         ],
 *                         "created": 1716895747171,
 *                         "deleted": false,
 *                         "name": "first",
 *                         "amount": 5,
 *                         "description": "gff qff to DC",
 *                         "order": 1,
 *                         "creatorId": "64522d0ce8032549d6f9abba",
 *                         "__v": 0
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
 * @apiError (Errors) 443855 Live stream not found
 * @apiError (Errors) 443858 User not allowed
 * @apiError (Errors) 443863 Invalid live stream id
 * @apiError (Errors) 4000007 Token invalid
 */

router.get("/:id", auth({ allowUser: true }), async function (request, response) {
  try {
    const { id } = request.params;
    const { recommId = null } = request.query;
    const { user } = request;
    const blocked = user.blocked || [];
    const age = !user?.dateOfBirth ? 1 : Utils.yearsFromBirthDate(user.dateOfBirth);

    if (!Utils.isValidObjectId(id)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidLiveStreamId,
        message: `GetLiveStreamController, GET by id - invalid liveStreamId: ${id}`,
      });
    }

    const liveStream = await LiveStream.findOne(
      { _id: id, ...(age < 18 ? { appropriateForKids: true } : {}) },
      { comments: 0 },
    ).lean();

    if (!liveStream || blocked.includes(liveStream.userId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeLiveStreamNotFound,
        message: "GetLiveStreamController, GET by id - live stream not found",
      });
    }

    if (!(await isUserAllowed({ liveStream, userId: user._id.toString() }))) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNotAllowed,
        message: "GetLiveStreamController, GET by id - user not allowed",
      });
    }

    await formatLiveStreamResponse({ liveStream });

    const responseData = { liveStream };
    Base.successResponse(response, Const.responsecodeSucceed, responseData);

    try {
      await recombee.recordInteraction({
        user,
        liveStream,
        type: "view",
        ...(recommId && { recommId }),
      });
    } catch (error) {
      logger.error("GetLiveStreamController, GET by id, recombee error: ", error);
    }
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "GetLiveStreamController, GET by id",
      error,
    });
  }
});

async function isUserAllowed({ liveStream, userId }) {
  const { userId: streamUserId, visibility, communityIds, tribeIds } = liveStream;

  if (streamUserId === userId) return true;

  if (visibility === "public") return true;

  const memberIds = [];

  if (visibility === "tribes") {
    const tribes = await Tribe.find({ _id: { $in: tribeIds } }).lean();

    for (const tribe of tribes) {
      const {
        ownerId,
        members: { accepted },
      } = tribe;

      memberIds.push(ownerId);
      for (const member of accepted) {
        memberIds.push(member.id);
      }
    }
  }

  if (visibility === "community") {
    const members = await User.find({
      "memberships.id": { $in: communityIds },
      $or: [
        { "memberships.expirationDate": -1 },
        { "memberships.expirationDate": { $lt: Date.now() } },
      ],
    }).lean();
    for (const member of members) {
      memberIds.push(member._id.toString());
    }

    const memberships = await Membership.find({ _id: { $in: communityIds } }).lean();
    for (const membership of memberships) {
      memberIds.push(membership.creatorId);
    }
  }

  return memberIds.includes(userId);
}

module.exports = router;
