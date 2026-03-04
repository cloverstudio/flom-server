"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { Tribe } = require("#models");
const { notifyTribeRequest } = require("../helpers");

/**
 * @api {patch} /api/v2/tribes/{tribeId}/join Request join a tribe
 * @apiVersion 2.0.10
 * @apiName Request join a tribe
 * @apiGroup WebAPI Tribe
 * @apiDescription This API is called for requesting join to a tribe
 *
 * @apiHeader {String} access-token Users unique access-token
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1643163567261,
 *   "data": {
 *     "requestSent": true
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 400007 Token not valid
 * @apiError (Errors) 443473 Bad id parameter
 * @apiError (Errors) 443474 Tribe not found
 * @apiError (Errors) 443476 Already joined
 * @apiError (Errors) 443477 Already requested
 */

router.patch("/:tribeId/join", auth({ allowUser: true }), async (request, response) => {
  try {
    const requestUserId = request.user._id.toString();
    const tribeId = request.params.tribeId;
    if (!Utils.isValidObjectId(tribeId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeTribeBadId,
        message: `RequestToJoinTribeController, bad tribe id`,
      });
    }

    const tribe = await Tribe.findById(tribeId);
    if (!tribe) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeTribeNotFound,
        message: `RequestToJoinTribeController, no tribe found`,
      });
    }

    if (
      tribe.ownerId === requestUserId ||
      tribe.members.accepted.find((member) => member.id === requestUserId)
    ) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeTribeAlreadyJoined,
        message: `RequestToJoinTribeController, already joined`,
      });
    }

    if (
      tribe.members.requested.find((member) => member.id === requestUserId) ||
      tribe.members.invited.find((member) => member.id === requestUserId) ||
      tribe.members.declined.find((member) => member.id === requestUserId)
    ) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeTribeAlreadyRequested,
        message: `RequestToJoinTribeController, already requested`,
      });
    }

    tribe.members.requested.push({ id: requestUserId, role: Const.tribeMemberRoleMember });

    await notifyTribeRequest({ tribe, requestUser: request.user });

    await tribe.save();

    Base.successResponse(response, Const.responsecodeSucceed, { requestSent: true });
  } catch (error) {
    Base.newErrorResponse({ response, message: "RequestToJoinTribeController", error });
  }
});

module.exports = router;
