"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { Room, Tribe } = require("#models");
const { socketApi } = require("#sockets");
const { updateInvitedUserNotification } = require("../helpers");

/**
 * @api {patch} /api/v2/tribes/{tribeId}/review-invitation Review tribe invitation
 * @apiVersion 2.0.10
 * @apiName Review tribe invitation
 * @apiGroup WebAPI Tribe
 * @apiDescription This API is called for reviewing tribe invitation
 *
 * @apiHeader {String} access-token Users unique access-token
 *
 * @apiParam {String} accepted Member tribe status ("0"/"1")
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
 * @apiError (Errors) 443480 Tribe full
 * @apiError (Errors) 443482 No invitation pending
 * @apiError (Errors) 443486 Maximum co-owners count reached
 */

router.patch(
  "/:tribeId/review-invitation",
  auth({ allowUser: true }),
  async (request, response) => {
    try {
      const requestUserId = request.user._id.toString();
      const tribeId = request.params.tribeId;
      const { accepted } = request.body;

      if (!Utils.isValidObjectId(tribeId)) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeTribeBadId,
          message: `ReviewInvitationController, bad tribe id`,
        });
      }

      const tribe = await Tribe.findById(tribeId);
      if (!tribe) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeTribeNotFound,
          message: `ReviewInvitationController, no tribe found`,
        });
      }

      const invitation = tribe.members.invited.find((member) => member.id === requestUserId);
      if (!invitation) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeTribeNoInvitationPending,
          message: `ReviewInvitationController, no invitation pending`,
        });
      }

      const userStatus = accepted === "1";
      if (userStatus) {
        if (tribe.members.accepted.length === Const.tribeMaxSize) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeTribeFull,
            message: `ReviewInvitationController, tribe full`,
          });
        }

        if (
          invitation.role === Const.tribeMemberRoleCoOwner &&
          tribe.members.accepted.filter((member) => member.role === Const.tribeMemberRoleCoOwner)
            .length >= Const.tribeMaxCoOwners
        ) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeTribeMaxCoOwnerCountReached,
            message: `ReviewInvitationController, maximum co-owners count reached`,
          });
        }
      }

      tribe.members.invited = tribe.members.invited.filter((member) => member.id !== requestUserId);

      if (userStatus) {
        tribe.members.accepted.push(invitation);
        await Room.updateOne({ _id: tribe.roomId }, { $push: { users: requestUserId } });
        socketApi.flom.joinTo(requestUserId, Const.chatTypeTribeGroupChat, tribe.roomId);
      }
      await tribe.save();

      await updateInvitedUserNotification({ tribe, userStatus, requestUser: request.user });

      Base.successResponse(response, Const.responsecodeSucceed, { userStatus });
    } catch (error) {
      Base.newErrorResponse({ response, message: "ReviewInvitationController", error });
    }
  },
);

module.exports = router;
