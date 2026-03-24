"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { LiveStream, User, Tribe, Membership, Transfer } = require("#models");

// const findUserProps = { phoneNumber: 1, userName: 1, created: 1, avatar: 1, bankAccounts: 1 };

/**
 * @api {get} /api/v2/livestreams/:liveStreamId/stats Get live stream statistics flom_v1
 * @apiVersion 2.0.19
 * @apiName  Get live stream statistics flom_v1
 * @apiGroup WebAPI Live Stream
 * @apiDescription  Get live stream statistics
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1711010802918,
 *     "data": {
 *         "credits": 350,
 *         "blessings": 11,
 *         "totalNumberOfViews": 33
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

router.get("/:liveStreamId/stats", auth({ allowUser: true }), async function (request, response) {
  try {
    const { liveStreamId } = request.params;
    const { user } = request;

    if (!Utils.isValidObjectId(liveStreamId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidObjectId,
        message: `GetLiveStreamStatsController, invalid liveStreamId: ${liveStreamId}`,
      });
    }

    const liveStream = await LiveStream.findById(liveStreamId, { comments: 0 }).lean();

    if (!liveStream) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeLiveStreamNotFound,
        message: "GetLiveStreamStatsController, live stream not found",
      });
    }

    if (!(await isUserAllowed({ liveStream, userId: user._id.toString() }))) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNotAllowed,
        message: "GetLiveStreamStatsController, user not allowed",
      });
    }

    const transfers = await Transfer.find({
      transferType: { $in: [Const.transferTypeSuperBless, Const.transferTypeSprayBless] },
      status: Const.transferComplete,
      liveStreamId,
    }).lean();

    let totalCredits = 0;

    for (const transfer of transfers) {
      const { creditsAmount, paymentMethodType } = transfer;

      if (paymentMethodType === Const.paymentMethodTypeCreditBalance) {
        totalCredits += creditsAmount;
      }
    }

    const responseData = {
      credits: totalCredits,
      blessings: transfers.length,
      totalNumberOfViews: liveStream.totalNumberOfViews ?? 0,
    };
    Base.successResponse(response, Const.responsecodeSucceed, responseData);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "GetLiveStreamStatsController",
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
