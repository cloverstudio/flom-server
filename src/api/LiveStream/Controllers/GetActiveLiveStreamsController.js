"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { LiveStream, Tribe } = require("#models");

/**
 * @api {get} /api/v2/livestreams/active Get active live streams flom_v1
 * @apiVersion 2.0.22
 * @apiName  Get active live streams flom_v1
 * @apiGroup WebAPI Live Stream
 * @apiDescription  Get active live streams
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1721034854233,
 *     "data": {
 *         "liveStreams": [
 *             {
 *                 "liveStreamId": "66715c311d56a2ff65523b2d",
 *                 "userId": "66715b7c1d56a2ff65523ade"
 *             },
 *             {
 *                 "liveStreamId": "6682ad223fba30dc0694e0ad",
 *                 "userId": "63dcc8b9bcc5921af87df5c8"
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

router.get("/", async function (request, response) {
  try {
    const liveStreams = await LiveStream.aggregate([
      { $match: { isActive: true } },
      { $sort: { created: -1 } },
      { $group: { _id: "$userId", doc: { $first: "$$ROOT" } } },
      { $replaceRoot: { newRoot: "$doc" } },
    ]);

    const responseData = {
      liveStreams: liveStreams.map((liveStream) => ({
        liveStreamId: liveStream._id.toString(),
        userId: liveStream.userId,
      })),
    };

    Base.successResponse(response, Const.responsecodeSucceed, responseData);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "GetActiveLiveStreamsController",
      error,
    });
  }
});

async function isUserAllowed({ liveStream, userId }) {
  const { userId: streamerId, visibility, membershipIds, tribeIds } = liveStream;

  if (streamerId === userId) return true;

  if (visibility === "public" || visibility === "community") return true;

  if (!userId) return false;

  const memberIds = [];

  if (visibility === "tribe") {
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

  /*
  if (visibility === "community") {
    const members = await User
      .find({
        "memberships.id": { $in: membershipIds },
        $or: [
          { "memberships.expirationDate": -1 },
          { "memberships.expirationDate": { $lt: Date.now() } },
        ],
      })
      .lean();
    for (const member of members) {
      memberIds.push(member._id.toString());
    }

    const memberships = await Membership.find({ _id: { $in: membershipIds } }).lean();
    for (const membership of memberships) {
      memberIds.push(membership.creatorId);
    }
  }
  */

  return memberIds.includes(userId);
}

module.exports = router;
