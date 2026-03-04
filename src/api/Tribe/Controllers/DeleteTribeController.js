"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { Room, Tribe, Favorite, History } = require("#models");
const { socketApi } = require("#sockets");
const { notifyTribeDeleted } = require("../helpers");

/**
 * @api {delete} /api/v2/tribes/{tribeId} Delete tribe
 * @apiVersion 2.0.10
 * @apiName Delete tribe
 * @apiGroup WebAPI Tribe
 * @apiDescription This API is called for deleting tribe
 *
 * @apiHeader {String} access-token Users unique access-token
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1643163567261,
 *   "data": {
 *     "deleted": true
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
 * @apiError (Errors) 443481 Only owner can delete tribe
 */

router.delete("/:tribeId", auth({ allowUser: true }), async (request, response) => {
  try {
    const tribeId = request.params.tribeId;
    if (!Utils.isValidObjectId(tribeId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeTribeBadId,
        message: `DeleteTribeController, bad tribe id`,
      });
    }

    const tribe = await Tribe.findById(tribeId);
    if (!tribe) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeTribeNotFound,
        message: `DeleteTribeController, no tribe found`,
      });
    }

    if (tribe.ownerId !== request.user._id.toString()) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeTribeOwnerOnlyDelete,
        message: `DeleteTribeController, only owner can delete tribe`,
      });
    }

    await notifyTribeDeleted({ tribe, owner: request.user });

    await tribe.deleteOne();

    await deleteTribeGroupChat({
      roomId: tribe.roomId,
      userIds: [tribe.ownerId, ...tribe.members.accepted.map((member) => member.id)],
    });

    Base.successResponse(response, Const.responsecodeSucceed, { deleted: true });
  } catch (error) {
    Base.newErrorResponse({ response, message: "DeleteTribeController", error });
  }
});

const deleteTribeGroupChat = async ({ roomId, userIds }) => {
  const room = await Room.findOneAndUpdate(
    { _id: roomId },
    { $set: { ownerRemoved: true, users: [], modified: Date.now() } },
    { new: true },
  );
  await History.deleteMany({ chatId: roomId, userId: { $in: userIds } });

  await Favorite.deleteMany({
    roomId: Const.chatTypeTribeGroupChat + "-" + roomId,
    userId: { $in: userIds },
  });

  for (const userId of userIds) {
    socketApi.flom.leaveFrom(userId, Const.chatTypeTribeGroupChat, roomId);
    socketApi.flom.emitToUser(userId, "delete_room", { conversation: room });
  }
};

module.exports = router;
