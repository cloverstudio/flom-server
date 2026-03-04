"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { User, LiveStream } = require("#models");
const { recombee } = require("#services");

/**
 * @api {get} /api/v2/livestreams/like Get users liked live streams flom_v1
 * @apiVersion 2.0.22
 * @apiName Get users liked live streams
 * @apiGroup WebAPI Live Stream
 * @apiDescription Get users liked live streams
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 *
 * @apiSuccessExample Success-Response:
 * {
 *     "code": 1,
 *     "time": 1717672963568,
 *     "data": {
 *         "likedLiveStreams": [
 *             "661e2fff94b4e7e4d00029f1",
 *             "661e310394b4e7e4d00029f5"
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
 * @apiError (Errors) 4000007 Token not valid
 */

router.get("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const {
      user: { likedLiveStreams = [] },
    } = request;

    const responseData = { likedLiveStreams };

    Base.successResponse(response, Const.responsecodeSucceed, responseData);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "LikeLiveStreamController - GET",
      error,
    });
  }
});

/**
 * @api {post} /api/v2/livestreams/like/add Like live stream by id flom_v1
 * @apiVersion 2.0.22
 * @apiName Like live stream by id
 * @apiGroup WebAPI Live Stream
 * @apiDescription Like live stream by id
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {String} liveStreamId liveStreamId
 * @apiParam {String} [recommId] recommId for recombee tracking
 *
 * @apiSuccessExample Success-Response:
 * {
 *   "code": 1,
 *   "time": 1540989079012,
 *   "data": {}
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
 * @apiError (Errors) 443864 Live stream already liked
 * @apiError (Errors) 4000007 Token not valid
 */

router.post("/add", auth({ allowUser: true }), async function (request, response) {
  try {
    const { liveStreamId, recommId = null } = request.body;
    const { user } = request;

    if (!liveStreamId || !Utils.isValidObjectId(liveStreamId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidLiveStreamId,
        message: `LikeLiveStreamController, Like - invalid liveStreamId: ${id}`,
      });
    }

    const liveStream = await LiveStream.findOne({ _id: liveStreamId }, { comments: 0 }).lean();

    if (!liveStream) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeLiveStreamNotFound,
        message: "LikeLiveStreamController, Like - live stream not found",
      });
    }

    const { likedLiveStreams = [], _id } = user;

    if (likedLiveStreams.includes(liveStreamId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeLiveStreamAlreadyLiked,
        message: "LikeLiveStreamController, Like - live stream already liked",
      });
    }

    await User.findByIdAndUpdate(_id.toString(), {
      $addToSet: { likedLiveStreams: liveStreamId },
    });

    await LiveStream.findByIdAndUpdate(liveStreamId, { $inc: { numberOfLikes: 1 } });

    Base.successResponse(response, Const.responsecodeSucceed);

    try {
      await recombee.recordInteraction({
        user,
        liveStream,
        type: "like",
        ...(recommId && { recommId }),
      });
    } catch (error) {
      logger.error("LikeLiveStreamController - Like, recombee error: ", error);
    }
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "LikeLiveStreamController - Like",
      error,
    });
  }
});

/**
 * @api {post} /api/v2/livestreams/like/remove Unlike live stream by id flom_v1
 * @apiVersion 2.0.22
 * @apiName Unlike live stream by id
 * @apiGroup WebAPI Live Stream
 * @apiDescription Unlike live stream by id
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {String} liveStreamId liveStreamId
 *
 * @apiSuccessExample Success-Response:
 * {
 *   "code": 1,
 *   "time": 1540989079012,
 *   "data": {}
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
 * @apiError (Errors) 443865 Live stream not liked
 * @apiError (Errors) 4000007 Token not valid
 **/

router.post("/remove", auth({ allowUser: true }), async function (request, response) {
  try {
    const { liveStreamId } = request.body;
    const { user } = request;

    if (!liveStreamId || !Utils.isValidObjectId(liveStreamId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidLiveStreamId,
        message: `LikeLiveStreamController, Unlike - invalid liveStreamId: ${id}`,
      });
    }

    const liveStream = await LiveStream.findOne({ _id: liveStreamId }, { comments: 0 }).lean();

    if (!liveStream) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeLiveStreamNotFound,
        message: "LikeLiveStreamController, Unlike - live stream not found",
      });
    }

    const { likedLiveStreams = [], _id } = user;

    if (!likedLiveStreams.includes(liveStreamId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeLiveStreamAlreadyLiked,
        message: "LikeLiveStreamController, Unlike - live stream not liked",
      });
    }

    await User.findByIdAndUpdate(_id.toString(), {
      $pull: { likedLiveStreams: liveStreamId },
    });

    await LiveStream.findByIdAndUpdate(liveStreamId, { $inc: { numberOfLikes: -1 } });

    Base.successResponse(response, Const.responsecodeSucceed);

    try {
      await recombee.recordInteraction({ user, liveStream, type: "unlike" });
    } catch (error) {
      logger.error("LikeLiveStreamController - Unlike, recombee error: ", error);
    }
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "LikeLiveStreamController - Unlike",
      error,
    });
  }
});

module.exports = router;
