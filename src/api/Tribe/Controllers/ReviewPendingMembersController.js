"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { Room, Tribe } = require("#models");
const { socketApi } = require("#sockets");
const { updateRequestedUserNotification } = require("../helpers");

/**
 * @api {patch} /api/v2/tribes/{tribeId}/review-pending-members Review pending members
 * @apiVersion 2.0.10
 * @apiName Review pending members
 * @apiGroup WebAPI Tribe
 * @apiDescription This API is called for reviewing pending members
 *
 * @apiHeader {String} access-token Users unique access-token
 *
 * @apiParam {String} accepted Member tribe status
 * @apiParam {String} memberId Reviewing member id
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1643163567261,
 *   "data": {
 *     "userStatus": true
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
 * @apiError (Errors) 443475 No permission to review
 * @apiError (Errors) 443476 Can't add Base to tribe
 * @apiError (Errors) 443479 Not found in applied list
 * @apiError (Errors) 443480 Tribe full
 */

router.patch(
  "/:tribeId/review-pending-members",
  auth({ allowUser: true }),
  async (request, response) => {
    try {
      const requestUserId = request.user._id.toString();
      const tribeId = request.params.tribeId;
      const { accepted, memberId } = request.body;

      if (!Utils.isValidObjectId(tribeId) || !Utils.isValidObjectId(memberId)) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeTribeBadId,
          message: `ReviewPendingMembersController, bad tribe id`,
        });
      }

      const tribe = await Tribe.findById(tribeId);
      if (!tribe) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeTribeNotFound,
          message: `ReviewPendingMembersController, no tribe found`,
        });
      }

      if (
        requestUserId !== tribe.ownerId &&
        tribe.members.accepted.find((member) => member.id === requestUserId)?.role !==
          Const.tribeMemberRoleCoOwner
      ) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeTribeEditNotAllowed,
          message: `ReviewPendingMembersController, review not allowed`,
        });
      }

      if (tribe.ownerId === memberId) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeTribeAlreadyJoined,
          message: `ReviewPendingMembersController, can't review Base`,
        });
      }

      const requestToJoin = tribe.members.requested.find((member) => member.id === memberId);
      if (!requestToJoin) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeTribePendingMemberNotFound,
          message: `ReviewPendingMembersController, pending member not found`,
        });
      }

      tribe.members.requested = tribe.members.requested.filter((member) => member.id !== memberId);

      const userStatus = accepted === "1";
      if (userStatus && tribe.members.accepted.length === Const.tribeMaxSize) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeTribeFull,
          message: `ReviewPendingMembersController, tribe full`,
        });
      }

      if (userStatus) {
        tribe.members.accepted.push(requestToJoin);
        await Room.updateOne({ _id: tribe.roomId }, { $push: { users: memberId } });
        socketApi.flom.joinTo(memberId, Const.chatTypeTribeGroupChat, tribe.roomId);
      }

      await updateRequestedUserNotification({
        tribe,
        requestApproverUser: request.user,
        tribeRequestUserId: memberId,
        userStatus,
      });

      await tribe.save();

      Base.successResponse(response, Const.responsecodeSucceed, { userStatus });
    } catch (error) {
      Base.newErrorResponse({ response, message: "ReviewPendingMembersController", error });
    }
  },
);

module.exports = router;
