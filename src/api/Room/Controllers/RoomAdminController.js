"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { Room } = require("#models");

/**
      * @api {post} /api/v2/room/admin/add ADD Room Admin Controller
      * @apiName ADD Room Admin Controller
      * @apiGroup WebAPI
      * @apiDescription Add admin from room
      * 
      * @apiHeader {String} access-token Users unique access-token.
      * 
      * @apiParam {String} newAdminId newAdminId
      * @apiParam {String} roomId roomId
      * 
      * @apiSuccessExample Success-Response:
        {
        "code": 1,
        "time": 1540989079012,
        "data": {
                room: {
                "users": [
                    "5bc71dbdbbafc22880c0a912",
                    "5ba391158f0ead4a1356173a",
                    "5bd05466e42d857e2a42a307",
                    "5bd05fd5b1015b7fb53a4646",
                    "5bd2ccfb301c9b3c3d37a3fa",
                    "5bd2e131301c9b3c3d37a412",
                    "5bea7f5f22a0c845f0a4a903"
                ],
                "admins": [
                    "5bc71dbdbbafc22880c0a912",
                    "5bd2e131301c9b3c3d37a412"
                ],
                "_id": "5c127f55bc38457351b7e58f",
                "owner": "5bc71dbdbbafc22880c0a912",
                "organizationId": "5ba391158f0ead4a13561739",
                "name": "Testing for clover",
                "created": 1544716117068,
                "__v": 1
            }
    }
            
    **/

router.post("/add", auth({ allowUser: true }), async function (request, response) {
  try {
    const newAdminId = request.body.newAdminId;
    const roomId = request.body.roomId;

    if (!newAdminId) return Base.successResponse(response, Const.responsecodeNoAdminId);
    if (!roomId) return Base.successResponse(response, Const.responsecodeNoRoomId);

    // find a room
    const room = await Room.findById(roomId);
    if (!room) return Base.successResponse(response, Const.responsecodeNoRoomFound);

    // check if user who wants to add new admin is admin
    if (!room.admins.includes(request.user._id.toString()))
      return Base.successResponse(response, Const.responsecodeUserIsNotAdmin);

    // check if user is already admin
    if (room.admins.includes(newAdminId))
      return Base.successResponse(response, Const.responsecodeUserIsAlreadyAdmin);

    // add new user as admin
    room.admins.push(newAdminId);

    // save new room model
    await room.save();

    // prepare data to send
    let dataToSend = {};
    dataToSend.room = room.toObject();

    Base.successResponse(response, Const.responsecodeSucceed, dataToSend);
  } catch (e) {
    console.log("Error: ", e);
    Base.errorResponse(response, Const.httpCodeServerError);
    return;
  }
});

/**
      * @api {post} /api/v2/room/admin Remove Room Admin Controller
      * @apiName Remove Room Admin Controller
      * @apiGroup WebAPI
      * @apiDescription Remove admin from room
      * 
      * @apiHeader {String} access-token Users unique access-token.
      * 
      * @apiParam {String} removeAdminId removeAdminId
      * @apiParam {String} roomId roomId
      * 
      * @apiSuccessExample Success-Response:
        {
        "code": 1,
        "time": 1540989079012,
        "data": {
            room: {
                "users": [
                    "5bc71dbdbbafc22880c0a912",
                    "5ba391158f0ead4a1356173a",
                    "5bd05466e42d857e2a42a307",
                    "5bd05fd5b1015b7fb53a4646",
                    "5bd2ccfb301c9b3c3d37a3fa",
                    "5bd2e131301c9b3c3d37a412",
                    "5bea7f5f22a0c845f0a4a903"
                ],
                "admins": [
                    "5bc71dbdbbafc22880c0a912",
                    "5bd2e131301c9b3c3d37a412"
                ],
                "_id": "5c127f55bc38457351b7e58f",
                "owner": "5bc71dbdbbafc22880c0a912",
                "organizationId": "5ba391158f0ead4a13561739",
                "name": "Testing for clover",
                "created": 1544716117068,
                "__v": 1
            }
                
            }
    }
            
    **/

router.post("/delete", auth({ allowUser: true }), async function (request, response) {
  try {
    const removeAdminId = request.body.removeAdminId;
    const roomId = request.body.roomId;

    if (!removeAdminId) return Base.successResponse(response, Const.responsecodeNoAdminId);

    if (!roomId) return Base.successResponse(response, Const.responsecodeNoRoomId);

    // find a room
    const room = await Room.findById(roomId);
    if (!room) return Base.successResponse(response, Const.responsecodeNoRoomFound);

    // check if user who wants to delete admin is admin
    if (!room.admins.includes(request.user._id.toString()))
      return Base.successResponse(response, Const.responsecodeUserIsNotAdmin);

    // check if user to remove is admin
    if (!room.admins.includes(removeAdminId))
      return Base.successResponse(response, Const.responsecodeUserIsNotAdmin);

    // check if user to remove is owner
    if (room.owner.toString() == removeAdminId)
      return Base.successResponse(response, Const.responsecodeUserIsOwner);

    // remove user as admin
    room.admins = room.admins.filter((str) => str != removeAdminId);

    // save new room model
    await room.save();

    // prepare data to send
    let dataToSend = {};
    dataToSend.room = room.toObject();

    Base.successResponse(response, Const.responsecodeSucceed, dataToSend);
  } catch (e) {
    console.log("Error: ", e);
    Base.errorResponse(response, Const.httpCodeServerError);
    return;
  }
});

module.exports = router;
