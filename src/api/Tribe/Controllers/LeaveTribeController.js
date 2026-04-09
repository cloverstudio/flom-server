"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { Room, Tribe, History } = require("#models");
const { socketApi } = require("#sockets");
const { notifyUserLeft, removeTribeRequestNotification } = require("../helpers");

/**
 * @api {patch} /api/v2/tribes/{tribeId}/leave Leave a tribe
 * @apiVersion 2.0.10
 * @apiName Leave a tribe
 * @apiGroup WebAPI Tribe
 * @apiDescription This API is called for leaving a tribe
 *
 * @apiHeader {String} access-token Users unique access-token
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1643163567261,
 *   "data": {
 *     "left": true
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
 * @apiError (Errors) 443478 Owner can't leave tribe
 */

router.patch("/:tribeId/leave", auth({ allowUser: true }), async (request, response) => {
  try {
    const requestUserId = request.user._id.toString();
    const tribeId = request.params.tribeId;
    if (!Utils.isValidObjectId(tribeId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeTribeBadId,
        message: `LeaveTribeController, bad tribe id`,
      });
    }

    const tribe = await Tribe.findById(tribeId);
    if (!tribe) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeTribeNotFound,
        message: `LeaveTribeController, no tribe found`,
      });
    }

    if (tribe.ownerId === requestUserId) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeTribeOwnerCantLeave,
        message: `LeaveTribeController, tribe owner cant leave`,
      });
    }

    if (tribe.members.accepted.find((member) => member.id === requestUserId)) {
      tribe.members.accepted = tribe.members.accepted.filter(
        (member) => member.id !== requestUserId,
      );

      await notifyUserLeft({ tribe, user: request.user });

      await tribe.save();

      const room = await Room.findOneAndUpdate(
        { _id: tribe.roomId },
        {
          $pull: { users: requestUserId },
          $set: { modified: Date.now() },
        },
        { new: true },
      );

      socketApi.leaveFrom(requestUserId, Const.chatTypeTribeGroupChat, tribe.roomId);

      await History.deleteOne({ chatId: tribe.roomId, userId: requestUserId });

      socketApi.emitToUser(requestUserId, "delete_room", {
        conversation: room.toObject(),
      });
    } else if (tribe.members.requested.find((member) => member.id === requestUserId)) {
      tribe.members.requested = tribe.members.requested.filter(
        (member) => member.id !== requestUserId,
      );
      await removeTribeRequestNotification({ tribeId, requestUserId: requestUserId });

      await tribe.save();
    }

    Base.successResponse(response, Const.responsecodeSucceed, { left: true });
  } catch (error) {
    Base.newErrorResponse({ response, message: "LeaveTribeController", error });
  }
});

module.exports = router;
