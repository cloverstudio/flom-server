"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { LiveStream, User, Tribe, Membership } = require("#models");

const findUserProps = { phoneNumber: 1, userName: 1, created: 1, avatar: 1, bankAccounts: 1 };

/**
 * @api {get} /api/v2/livestreams/:liveStreamId/viewers Get live stream viewers flom_v1
 * @apiVersion 2.0.22
 * @apiName  Get live stream viewers flom_v1
 * @apiGroup WebAPI Live Stream
 * @apiDescription  Get live stream viewers
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiParam (Query string) {Number} [page] Page. Default: 1
 * @apiParam (Query string) {Number} [size] Page size. Default: 10
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1711010802918,
 *     "data": {
 *         "viewers": [
 *            {
 *                "_id":"63dceca0c30542684f1b7b68",
 *                "bankAccounts":[
 *                   {
 *                      "merchantCode":"40200168",
 *                      "name":"SampleAcc",
 *                      "accountNumber":"1503567574679",
 *                      "code":"",
 *                      "selected":true,
 *                      "lightningUserName":"40200168",
 *                      "lightningAddress":"40200168@v2.flom.dev",
 *                      "lightningUrlEncoded":"LNURL1DP68GURN8GHJ7A3J9ENXCMMD9EJX2A309EMK2MRV944KUMMHDCHKCMN4WFK8QTE5XQERQVP3XCUQXZ6U2G"
 *                   }
 *                ],
 *                "created":1675422880810,
 *                "phoneNumber":"+2348020000019",
 *                "userName":"mer19abc",
 *                "avatar":{
 *                   "picture":{
 *                      "originalName":"2023-04-24-17-38-37-082.jpg",
 *                      "size":2265481,
 *                      "mimeType":"image/png",
 *                      "nameOnServer":"hL7WaN28shRJACbLlS72nF4bwHKAzzwd"
 *                   },
 *                   "thumbnail":{
 *                      "originalName":"2023-04-24-17-38-37-082.jpg",
 *                      "size":63900,
 *                      "mimeType":"image/png",
 *                      "nameOnServer":"NiKrnRRft47uLGjP79bVJmguMVKr9eVE"
 *                   }
 *                },
 *            }
 *         ],
 *         "paginationData": {
 *             "page": 1,
 *             "size": 1,
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
 * @apiError (Errors) 443411 Invalid object id
 * @apiError (Errors) 443855 Live stream not found
 * @apiError (Errors) 443858 User not allowed
 * @apiError (Errors) 4000007 Token invalid
 */

router.get("/:liveStreamId/viewers", auth({ allowUser: true }), async function (request, response) {
  try {
    const { liveStreamId } = request.params;
    const { user } = request;
    const { page: p, size: s } = request.query;

    const page = !p ? 1 : +p;
    const size = !s ? Const.newPagingRows : +s;

    if (!Utils.isValidObjectId(liveStreamId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidObjectId,
        message: `GetLiveStreamViewersController, invalid liveStreamId: ${liveStreamId}`,
      });
    }

    const liveStream = await LiveStream.findById(liveStreamId, { comments: 0 }).lean();

    if (!liveStream) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeLiveStreamNotFound,
        message: "GetLiveStreamViewersController, live stream not found",
      });
    }

    if (!(await isUserAllowed({ liveStream, userId: user._id.toString() }))) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNotAllowed,
        message: "GetLiveStreamViewersController, user not allowed",
      });
    }

    const { viewerIds = [] } = liveStream;

    const viewers =
      viewerIds.length === 0
        ? []
        : await User.find({ _id: { $in: viewerIds } }, findUserProps).lean();

    const total = viewers.length;
    const hasNext = page * size < total;

    const paginatedViewers =
      total === 0 ? [] : viewers.slice((page - 1) * size, (page - 1) * size + size);

    const paginationData = { page, size, total, hasNext };

    const responseData = { viewers: paginatedViewers, paginationData };
    Base.successResponse(response, Const.responsecodeSucceed, responseData);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "GetLiveStreamViewersController",
      error,
    });
  }
});

async function isUserAllowed({ liveStream, userId }) {
  const { userId: streamUserId, visibility, membershipIds, tribeIds } = liveStream;

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
      "memberships.id": { $in: membershipIds },
      $or: [
        { "memberships.expirationDate": -1 },
        { "memberships.expirationDate": { $lt: Date.now() } },
      ],
    }).lean();
    for (const member of members) {
      memberIds.push(member._id.toString());
    }

    const memberships = await Membership.find({ _id: { $in: membershipIds } }).lean();
    for (const membership of memberships) {
      memberIds.push(membership.creatorId);
    }
  }

  return memberIds.includes(userId);
}

module.exports = router;
