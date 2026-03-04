"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Config, Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { LiveStream, User } = require("#models");

/**
 * @api {post} /api/v2/admin-page/manage-livestreams Manage live streams flom_v1
 * @apiVersion 2.0.29
 * @apiName  Manage live streams flom_v1
 * @apiGroup WebAPI Admin page
 * @apiDescription  Manage live streams: block/unblock user from creating live streams, end livestreams
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiParam {String}  targetType  Target of action: "user" or "liveStream"
 * @apiParam {String}  targetId    Id of user or livestream
 * @apiParam {String}  action      For users: "block" and "unblock", for live streams: "end"
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1640008101292,
 *   "data": {}
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443927 Invalid target type
 * @apiError (Errors) 443928 Invalid target id
 * @apiError (Errors) 443232 Invalid action
 * @apiError (Errors) 443040 User not found
 * @apiError (Errors) 443855 User not found
 * @apiError (Errors) 4000007 Token invalid
 */

router.post(
  "/",
  auth({ allowAdmin: true, role: Const.Role.ADMIN }),
  async function (request, response) {
    try {
      const { targetType, targetId, action } = request.body;

      if (!["liveStream", "user"].includes(targetType)) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidTargetType,
          message: "ManageLiveStreamsController, invalid target type: " + targetType,
        });
      }

      if (!Utils.isValidObjectId(targetId)) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidTargetId,
          message: "ManageLiveStreamsController, invalid id: " + targetId,
        });
      }

      if (
        (targetType === "user" && !["block", "unblock"].includes(action)) ||
        (targetType === "liveStream" && action !== "end")
      ) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidAction,
          message: "ManageLiveStreamsController, invalid action: " + action,
        });
      }

      if (targetType === "user") {
        const user = await User.findByIdAndUpdate(
          targetId,
          { blockedFromCreatingLiveStreams: action === "block" },
          { new: true, lean: true },
        );

        if (!user) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeUserNotFound,
            message: "ManageLiveStreamsController, user not found: " + targetId,
          });
        }
      }

      if (targetType === "liveStream" && action === "end") {
        const liveStream = await LiveStream.findByIdAndUpdate(
          targetId,
          {
            endTimeStamp: Date.now(),
            isActive: false,
            modified: Date.now(),
          },
          { new: true, lean: true },
        );

        if (!liveStream) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeLiveStreamNotFound,
            message: "ManageLiveStreamsController, live stream not found: " + targetId,
          });
        }

        const url = !liveStream.domain
          ? `${Config.antMediaBaseUrl}/v2/broadcasts/${targetId}/stop`
          : `https://${liveStream.domain}/WebRTCAppEE/rest/v2/broadcasts/${targetId}/stop`;

        await Utils.sendRequest({
          method: "POST",
          url,
          headers: { "content-type": "application/json" },
          body: {},
        });
      }

      Base.successResponse(response, Const.responsecodeSucceed);
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "ManageLiveStreamsController",
        error,
      });
    }
  },
);

module.exports = router;
