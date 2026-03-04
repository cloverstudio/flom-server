"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { Room, Favorite, History } = require("#models");
const { socketApi } = require("#sockets");

/**
      * @api {post} /api/v2/room/leave Leave from room
      * @apiName Leave from room
      * @apiGroup WebAPI
      * @apiHeader {String} access-Token Users unique access-token.
      * @apiDescription Leave from joined room.
      * @apiParam {string} roomId roomId
      * @apiSuccessExample Success-Response:
     
 {
     success: 1,
     data: {
     }
 }
 
     */

router.post("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const roomId = request.body.roomId;
    const loginUserId = request.user._id.toString();

    const room = await Room.findById(roomId).lean();
    if (!room) {
      return Base.successResponse(response, Const.responsecodeLeaveRoomWrongRoomId);
    }

    const roomQuery = { $pull: { users: loginUserId }, $set: { modified: Date.now() } };
    if (loginUserId === room.owner.toString()) {
      roomQuery.$set = { ownerRemoved: true };
    }

    await Room.findByIdAndUpdate(roomId, roomQuery);

    if (loginUserId === room.owner.toString()) {
      await History.updateMany(
        { chatId: room._id.toString() },
        { $set: { ownerRemoved: true, lastUpdate: Date.now() } },
      );
      // send socket
      room.users.forEach((userId) => {
        if (userId) {
          socketApi.flom.emitToUser(userId, "delete_room", {
            conversation: room,
          });
        }
      });
    } else {
      await History.deleteMany({ chatId: room._id.toString(), userId: loginUserId });
      await Favorite.deleteMany({
        roomId: Const.chatTypeRoom + "-" + room._id.toString(),
        userId: loginUserId,
      });
    }

    // stop sending notification
    socketApi.flom.leaveFrom(loginUserId, Const.chatTypeRoom, roomId);

    return Base.successResponse(response, Const.responsecodeSucceed);
  } catch (error) {
    console.error("Error in LeaveRoomController:", error);
    return Base.errorResponse(response, Const.httpCodeServerError);
  }
});

module.exports = router;
