"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { LiveStream, FlomMessage } = require("#models");
const { socketApi } = require("#sockets");
const { formatLiveStreamResponse } = require("#logics");
const { recombee } = require("#services");

/**
 * @api {post} /api/v2/livestreams/end End live stream flom_v1
 * @apiVersion 2.0.23
 * @apiName End live stream
 * @apiGroup WebAPI Live Stream
 * @apiDescription API that ends live stream. Id is sent either in query string or in request body.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam (Query string) {String}   liveStreamId    Live stream id
 * @apiParam (Request body) {String}   liveStreamId    Live stream id
 * @apiParam (Request body) {Boolean}  deleteComments  If parameter is true, comments will be deleted
 *
 * @apiSuccessExample Success-Response:
 * {
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443863 Invalid live stream id
 * @apiError (Errors) 443855 Live stream not found
 * @apiError (Errors) 443858 User not stream owner
 * @apiError (Errors) 443876 Live stream already ended
 * @apiError (Errors) 4000007 Token not valid
 */

router.post("/end", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const userId = user._id.toString();

    const { liveStreamId: idFromRequestBody = null, deleteComments } = request.body;
    const { liveStreamId: idFromQueryString = null } = request.query;

    const liveStreamId = idFromRequestBody || idFromQueryString;

    if (!liveStreamId || !Utils.isValidObjectId(liveStreamId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidLiveStreamId,
        message: `EndLiveStreamController, invalid liveStreamId: ${liveStreamId}`,
      });
    }

    const liveStream = await LiveStream.findOne({ _id: liveStreamId }, { comments: 0 }).lean();

    if (!liveStream) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeLiveStreamNotFound,
        message: "EndLiveStreamController, live stream not found",
      });
    }

    if (liveStream.userId !== userId) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNotAllowed,
        message: "EndLiveStreamController, user not stream owner",
      });
    }

    if (liveStream.endTimeStamp) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeLiveStreamAlreadyEnded,
        message: "EndLiveStreamController, live stream already ended",
      });
    }

    const now = Date.now();

    const updateObj = {
      $set: { endTimeStamp: now, modified: now, isActive: false },
      $unset: { comments: 1 },
    };
    if (deleteComments !== true) {
      delete updateObj.$unset;
    }

    const updatedLiveStream = await LiveStream.findByIdAndUpdate(liveStreamId, updateObj, {
      new: true,
      lean: true,
    });

    await FlomMessage.updateMany(
      { type: Const.messageTypeNewLiveStream, "attributes.liveStream._id": liveStreamId },
      {
        $set: {
          "attributes.liveStream.endTimeStamp": now,
          "attributes.liveStream.isActive": false,
        },
      },
    );

    await formatLiveStreamResponse({ liveStream: updatedLiveStream });

    const responseData = { updatedLiveStream };
    Base.successResponse(response, Const.responsecodeSucceed, responseData);

    try {
      await recombee.upsertLiveStream({ liveStream: updatedLiveStream });
    } catch (error) {
      logger.error("EndLiveStreamController, recombee error: ", error);
    }

    try {
      socketApi.emitAll("userStoppedStreaming", {
        userId,
        liveStreamId,
      });
    } catch (error) {
      logger.error("EndLiveStreamController, socket api", error);
    }

    try {
      const dataToSend = {
        messageType: "streamUpdated",
        liveStreamId,
        streamData: updatedLiveStream,
      };
      await Utils.sendMessageToLiveStream({ liveStream, data: dataToSend });
    } catch (error) {
      logger.error("EndLiveStreamController, messages", error);
    }
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "EndLiveStreamController",
      error,
    });
  }
});

module.exports = router;
