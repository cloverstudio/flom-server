"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { LiveStream } = require("#models");
const { formatLiveStreamResponse } = require("#logics");

/**
 * @api {get} /api/v2/user/reject-cohost/:liveStreamId Reject live stream cohost invitation flom_v1
 * @apiVersion 2.0.21
 * @apiName  Reject live stream cohost invitation flom_v1
 * @apiGroup WebAPI User
 * @apiDescription  Reject live stream cohost invitation.
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1711010802918,
 *     "data": {}
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443863 Invalid livestream id
 * @apiError (Errors) 443855 Live stream not found
 * @apiError (Errors) 4000007 Token invalid
 */

router.get("/:liveStreamId", auth({ allowUser: true }), async function (request, response) {
  try {
    const { liveStreamId } = request.params;

    if (!liveStreamId || !Utils.isValidObjectId(liveStreamId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidLiveStreamId,
        message: "RejectCohostInvitationController, invalid liveStreamId",
      });
    }

    const { user } = request;
    const userId = user._id.toString();

    const liveStream = await LiveStream.findById(liveStreamId).lean();

    if (!liveStream) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeLiveStreamNotFound,
        message: "RejectCohostInvitationController, live stream not found",
      });
    }

    const { cohosts = [] } = liveStream;

    if (cohosts.includes(userId)) {
      const updatedLiveStream = await LiveStream.findByIdAndUpdate(
        liveStreamId,
        { $pull: { cohosts: userId } },
        {
          new: true,
          lean: true,
        },
      );

      await formatLiveStreamResponse({ liveStream: updatedLiveStream });

      const dataToSend = {
        messageType: "streamUpdated",
        liveStreamId,
        streamData: updatedLiveStream,
      };
      await Utils.sendMessageToLiveStream({ liveStream, data: dataToSend });
    }

    Base.successResponse(response, Const.responsecodeSucceed);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "RejectCohostInvitationController",
      error,
    });
  }
});

module.exports = router;
