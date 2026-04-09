"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { User, Room } = require("#models");
const { socketApi } = require("#sockets");

/**
      * @api {post} /api/v2/room/users/add Add users to room
      * @apiName Add users to room
      * @apiGroup WebAPI
      * @apiDescription Update profile of conversation
      * @apiHeader {String} access-Token Users unique access-token.
      * @apiParam {string} roomId roomId
      * @apiParam {Array} users Array of user ids
 
      * @apiSuccessExample Success-Response:
 {
     "code": 1,
     "time": 1457082886197,
     "data": {
         "room": {
             "_id": "56d94c88bf06a1f30ad6091d",
             "owner" : "56c32acd331dd81f8134f200"
             "ownerModel": {
                 "_id": "56c32acd331dd81f8134f200",
                 "name": "Ken",
                 "sortName": "ken yasue",
                 "description": "ああああ",
                 "userid": "kenyasue",
                 "password": "*****",
                 "created": 1455631053660,
                 "status": 1,
                 "organizationId": "56ab7b9061b760d9eb6feba3",
                 "__v": 0,
                 "tokenGeneratedAt": 1457082869691,
                 "token": "*****",
                 "departments": [],
                 "groups": ["56cf0a60ed51d2905e28a848"],
                 "avatar": {
                     "thumbnail": {
                         "originalName": "2015-01-11 21.30.05 HDR.jpg",
                         "size": 1551587,
                         "mimeType": "image/png",
                         "nameOnServer": "c2gQT5IMJAYqx89eo8gwFrKJSRxlFYFU"
                     },
                     "picture": {
                         "originalName": "2015-01-11 21.30.05 HDR.jpg",
                         "size": 1551587,
                         "mimeType": "image/png",
                         "nameOnServer": "jf7mBTsU6CVfFPLsnY4Ijqcuo6vYTKAs"
                     }
                 }
             },
             "name": "ああああああ",
             "created": 1457081480907,
             "__v": 0,
             "description": "いいいいいddd",
             "modified": 1457082886193,
             "avatar": {
                 "thumbnail": {
                     "originalName": "2014-06-03 17.23.39.jpg",
                     "size": 1504586,
                     "mimeType": "image/png",
                     "nameOnServer": "ut4G1A3Jq9LbfeDxXUh8jibgDB4wPGV1"
                 },
                 "picture": {
                     "originalName": "2014-06-03 17.23.39.jpg",
                     "size": 1504586,
                     "mimeType": "image/png",
                     "nameOnServer": "egStPNb3ysJKhUGtyeFzcwKCPgmp5Cnj"
                 }
             },
             "users": ["56c32acd331dd81f8134f200"]
         }
     }
 }
     */
router.post("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const roomId = request.body.roomId;
    const userIds = request.body.users.filter((userId) => Utils.isObjectId(userId));
    const user = request.user;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return Base.successResponse(response, Const.responsecodeAddUsersToRoomWrongUserId);
    }

    const room = await Room.findById(roomId).lean();
    if (!room) {
      return Base.successResponse(response, Const.responsecodeAddUsersToRoomWrongRoomId);
    }

    if (!room.admins.includes(user._id.toString()) && user._id.toString() !== room.owner) {
      return Base.successResponse(response, Const.responsecodeAddUsersToRoomUserIsNotAdmin);
    }

    const users = await User.find({ _id: { $in: userIds } }).lean();
    const newUserIds = Array.from(
      new Set(users.map((user) => user._id.toString()).concat(room.users)),
    );

    const updatedRoom = await Room.findByIdAndUpdate(
      roomId,
      { users: newUserIds },
      { new: true, lean: true },
    );
    updatedRoom.ownerModel = request.user.toObject();
    users.forEach((user) => {
      socketApi.joinTo(user._id, Const.chatTypeRoom, roomId);
    });

    return Base.successResponse(response, Const.responsecodeSucceed, { room: updatedRoom });
  } catch (error) {
    console.error("Error in AddUsersToRoomController:", error);
    return Base.errorResponse(response, Const.httpCodeServerError);
  }
});

module.exports = router;
