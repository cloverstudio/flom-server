"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { User, LiveStream, Notification } = require("#models");
const { formatLiveStreamResponse } = require("#logics");

/**
 * @api {post} /api/v2/livestreams/mute-cohost Mute cohost flom_v1
 * @apiVersion 2.0.22
 * @apiName Mute cohost
 * @apiGroup WebAPI Live Stream
 * @apiDescription Mute cohost
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {String} liveStreamId  Live stream id
 * @apiParam {String} cohostId      Cohost user id
 *
 * @apiSuccessExample Success-Response:
 * {
 *     "code": 1,
 *     "time": 1717672963568,
 *     "data": {
 *     }
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
 * @apiError (Errors) 443870 Invalid cohost id
 * @apiError (Errors) 4000007 Token not valid
 */

router.post("/mute-cohost", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const { liveStreamId, cohostId } = request.body;

    if (!cohostId || !Utils.isValidObjectId(cohostId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidCohostId,
        message: `CohostController, mute cohost - invalid cohost id: ${cohostId}`,
      });
    }

    if (!liveStreamId || !Utils.isValidObjectId(liveStreamId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidLiveStreamId,
        message: `CohostController, mute cohost - invalid liveStreamId: ${liveStreamId}`,
      });
    }

    const liveStream = await LiveStream.findOne({ _id: liveStreamId }, { comments: 0 }).lean();

    if (!liveStream) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeLiveStreamNotFound,
        message: `CohostController, mute cohost - live stream not found: ${liveStreamId}`,
      });
    }

    if (liveStream.userId !== user._id.toString()) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNotAllowed,
        message: `CohostController, mute cohost - user not stream owner: ${user._id}`,
      });
    }

    const updatedLiveStream = await LiveStream.findByIdAndUpdate(
      liveStreamId,
      { $addToSet: { mutedCohosts: cohostId } },
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

    Base.successResponse(response, Const.responsecodeSucceed);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: `CohostController, mute cohost - live stream id: ${request.body.liveStreamId}`,
      error,
    });
  }
});

/**
 * @api {post} /api/v2/livestreams/unmute-cohost Unmute cohost flom_v1
 * @apiVersion 2.0.22
 * @apiName Unmute cohost
 * @apiGroup WebAPI Live Stream
 * @apiDescription Unmute cohost
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {String} liveStreamId  Live stream id
 * @apiParam {String} cohostId      Cohost user id
 *
 * @apiSuccessExample Success-Response:
 * {
 *     "code": 1,
 *     "time": 1717672963568,
 *     "data": {
 *     }
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
 * @apiError (Errors) 443870 Invalid cohost id
 * @apiError (Errors) 4000007 Token not valid
 */

router.post("/unmute-cohost", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const { liveStreamId, cohostId } = request.body;

    if (!cohostId || !Utils.isValidObjectId(cohostId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidCohostId,
        message: `CohostController, unmute cohost - invalid cohost id: ${cohostId}`,
      });
    }

    if (!liveStreamId || !Utils.isValidObjectId(liveStreamId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidLiveStreamId,
        message: `CohostController, unmute cohost - invalid liveStreamId: ${liveStreamId}`,
      });
    }

    const liveStream = await LiveStream.findOne({ _id: liveStreamId }, { comments: 0 }).lean();

    if (!liveStream) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeLiveStreamNotFound,
        message: `CohostController, unmute cohost - live stream not found: ${liveStreamId}`,
      });
    }

    if (liveStream.userId !== user._id.toString()) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNotAllowed,
        message: `CohostController, unmute cohost - user not stream owner: ${user._id}`,
      });
    }

    const updatedLiveStream = await LiveStream.findByIdAndUpdate(
      liveStreamId,
      { $pull: { mutedCohosts: cohostId } },
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

    Base.successResponse(response, Const.responsecodeSucceed);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: `CohostController, unmute cohost - live stream id: ${request.body.liveStreamId}`,
      error,
    });
  }
});

/**
 * @api {post} /api/v2/livestreams/manage-cohosts Manage cohosts flom_v1
 * @apiVersion 2.0.23
 * @apiName Manage cohosts
 * @apiGroup WebAPI Live Stream
 * @apiDescription API that live stream host uses to add or remove cohosts or cohost cameras. Do not both add/remove cohosts, add, remove cameras at the same time.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {String}    liveStreamId       Live stream id
 * @apiParam {String[]}  cohostsToAdd       Ids of cohosts to add
 * @apiParam {String[]}  cohostsToRemove    Ids of cohosts to remove
 * @apiParam {Boolean}   sendNotifications  Should app send notifications to new cohosts (default: true)
 * @apiParam {Object[]}  [camerasToAdd]              Array of stream objects with new cameras for streamer
 * @apiParam {String}    [camerasToAdd.cohostId]     Cohost ID
 * @apiParam {String}    [camerasToAdd.streamId]     Stream ID
 * @apiParam {String[]}  [camerasToRemove]           Array of strings with stream ids to remove
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
 * @apiError (Errors) 443870 Invalid cohost id
 * @apiError (Errors) 443871 Cohost not found
 * @apiError (Errors) 443872 Too many cohosts
 * @apiError (Errors) 443873 Only event type livestream can have cohosts
 * @apiError (Errors) 443874 User is already a cohost
 * @apiError (Errors) 443877 Missing streamid for new camera
 * @apiError (Errors) 4000007 Token not valid
 */

router.post("/manage-cohosts", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const {
      liveStreamId,
      cohostsToAdd = [],
      cohostsToRemove = [],
      sendNotifications: sendNotif,
      camerasToAdd = [],
      camerasToRemove = [],
    } = request.body;
    let sendNotifications = sendNotif !== false;

    if (!liveStreamId || !Utils.isValidObjectId(liveStreamId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidLiveStreamId,
        message: `CohostController, manage cohosts - invalid liveStreamId: ${liveStreamId}`,
      });
    }

    const liveStream = await LiveStream.findOne({ _id: liveStreamId }, { comments: 0 }).lean();

    if (!liveStream) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeLiveStreamNotFound,
        message: `CohostController, manage cohosts - live stream not found: ${liveStreamId}`,
      });
    }

    if (liveStream.userId !== user._id.toString()) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNotAllowed,
        message: `CohostController, manage cohosts - user not stream owner: ${user._id}`,
      });
    }

    if (liveStream.type !== "event") {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeOnlyLiveEventCanHaveCohosts,
        message: `CohostController, manage cohosts - only type 'event' can have cohosts: ${liveStreamId}`,
      });
    }

    let newCohostUserModels = [],
      newCohosts = [];
    const { cohosts: oldCohosts = [] } = liveStream;

    if (cohostsToAdd.length > 0 || cohostsToRemove.length > 0) {
      for (const cohostId of [...cohostsToAdd, ...cohostsToRemove]) {
        if (!Utils.isValidObjectId(cohostId)) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidCohostId,
            message: `CohostController, manage cohosts - invalid cohost id: ${cohostId}`,
          });
        }
      }

      if (
        oldCohosts.length + cohostsToAdd.length - cohostsToRemove.length >
        Const.maxLiveStreamCohosts
      ) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeTooManyCohosts,
          message: `CohostController, manage cohosts - too many cohosts: ${liveStreamId}`,
        });
      }

      for (const cohostId of cohostsToAdd) {
        if (oldCohosts.includes(cohostId)) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeUserIsAlreadyCohost,
            message: `CohostController, manage cohosts - user is already a cohost: ${cohostId}`,
          });
        }

        const cohost = await User.findById(cohostId, { isDeleted: 1 }).lean();

        if (!cohost || cohost?.isDeleted?.value === true) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeCohostNotFound,
            message: `CohostController, manage cohosts - cohost ${cohostId} not found`,
          });
        }

        newCohostUserModels.push(cohost);
      }

      newCohosts = [...oldCohosts, ...cohostsToAdd].filter((id) => !cohostsToRemove.includes(id));
    }

    const set = { modified: Date.now() };
    set.cohosts = newCohosts;

    let addToSet = null,
      pull = null;

    if (camerasToAdd.length > 0) {
      for (const camera of camerasToAdd) {
        if (!camera.streamId) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeStreamIdMissing,
            message: "CohostController, manage cohosts - missing stream id for camera",
          });
        }
      }

      addToSet = { additionalCohostCameras: { $each: camerasToAdd } };
    }

    if (camerasToRemove.length > 0) {
      pull = { additionalCohostCameras: { streamId: { $in: camerasToRemove } } };
    }

    const updateObj = {
      $set: set,
      ...(!addToSet ? {} : { $addToSet: addToSet }),
      ...(!pull ? {} : { $pull: pull }),
    };

    const updatedLiveStream = await LiveStream.findByIdAndUpdate(liveStreamId, updateObj, {
      new: true,
      lean: true,
    });

    await formatLiveStreamResponse({ liveStream: updatedLiveStream });

    const responseData = { updatedLiveStream };
    Base.successResponse(response, Const.responsecodeSucceed, responseData);

    try {
      const dataToSend = {
        messageType: "streamUpdated",
        liveStreamId,
        streamData: updatedLiveStream,
      };
      await Utils.sendMessageToLiveStream({ liveStream, data: dataToSend });

      if (sendNotifications) {
        for (const cohost of newCohostUserModels) {
          await Notification.create({
            title: `Live stream co-host invitation`,
            text: `${user.userName} is inviting ${cohost?.userName || "you"} to co-host: ${
              liveStream.name
            }`,
            receiverIds: [cohost?._id.toString()],
            senderId: user._id.toString(),
            referenceId: liveStreamId,
            notificationType: Const.notificationTypeLiveStreamCohostInvitation,
          });

          let roomId = "";

          if (user.created < cohost.created) {
            roomId = `1-${user._id.toString()}-${cohost?._id.toString()}`;
          } else {
            roomId = `1-${cohost?._id.toString()}-${user._id.toString()}`;
          }

          const messageToSend = {
            roomID: roomId,
            message: `${user.userName} is inviting ${cohost?.userName || "you"} to co-host: ${
              liveStream.name
            }`,
            type: Const.messageTypeLiveStreamCohostInvitation,
            attributes: { liveStream: updatedLiveStream },
          };

          await Utils.sendMessageToChat({
            messageData: messageToSend,
            senderToken: user.token[0].token,
          });

          if (cohost.pushToken && cohost.pushToken.length > 0) {
            await Utils.sendPushNotifications({
              pushTokens: cohost.pushToken,
              pushType: Const.pushTypeLiveStreamCohostInvitation,
              info: {
                title: `${user.userName} is inviting you to co-host: ${liveStream.name}`,
                liveStream: updatedLiveStream,
              },
            });
          }
        }
      }
    } catch (error) {
      logger.error("CohostController, manage cohosts - notifications", error);
    }
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "CohostController, manage cohosts",
      error,
    });
  }
});

module.exports = router;
