"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { Room, User } = require("#models");

/**
      * @api {get} /api/v2/room/detail/:roomId RoomDetail
      * @apiName RoomDetail
      * @apiGroup WebAPI
      * @apiDescription Returns room detail
      * @apiHeader {String} access-token Users unique access-token.
      * @apiSuccessExample Success-Response:
 
 {
     code: 1,
     time: 1457092969492,
     data: {
         room: {
             _id: '56d979690c0ce24041304b43',
             description: 'description',
             owner: '56d979670c0ce24041304b3b',
             name: 'Room1Changeg',
             created: 1457092969060,
             __v: 0,
             modified: 1457092969368,
             avatar: {
                 thumbnail: {
                     originalName: 'max.jpg',
                     size: 64914,
                     mimeType: 'image/png',
                     nameOnServer: 'p9qj4omrwLGRJ2HY0ycDGRBnWZ8sSdNC'
                 },
                 picture: {
                     originalName: 'max.jpg',
                     size: 64914,
                     mimeType: 'image/png',
                     nameOnServer: 'm5K6IcDbFPLA7Rb802JyLgdUENnp065j'
                 }
             },
             users: ['56d979670c0ce24041304b3b',
                 '56d979670c0ce24041304b3c',
                 '56d979670c0ce24041304b3d'
             ],
             userModels: [{
                 _id: '56d979670c0ce24041304b3b',
                 name: 'test',
                 userid: 'userid1VLoM0',
                 password: '*****',
                 organizationId: '56d979670c0ce24041304b3a',
                 created: 1457092967847,
                 status: 1,
                 __v: 0,
                 tokenGeneratedAt: 1457092968300,
                 token: '*****',
                 description: null,
                 departments: [],
                 groups: [],
                 avatar: {
                     thumbnail: {
                         originalName: 'max.jpg',
                         size: 64914,
                         mimeType: 'image/png',
                         nameOnServer: 'If9mccjOJGIDezaV9s8B3wtLLvIL1QcB'
                     },
                     picture: {
                         originalName: 'max.jpg',
                         size: 64914,
                         mimeType: 'image/png',
                         nameOnServer: 'CXOAffrBqgWfXzr5ytywezBZh4KVUbJV'
                     }
                 }
             }, {
                 _id: '56d979670c0ce24041304b3c',
                 name: 'User2',
                 userid: 'userid2AztOz',
                 password: '*****',
                 organizationId: '56d979670c0ce24041304b3a',
                 created: 1457092967858,
                 status: 1,
                 __v: 0,
                 tokenGeneratedAt: 1457092968295,
                 token: '*****',
                 description: null,
                 departments: [],
                 groups: [],
                 avatar: {
                     thumbnail: {
                         originalName: 'user1.jpg',
                         size: 36023,
                         mimeType: 'image/png',
                         nameOnServer: 'g7AmtxYWVfZxFWzoc5LFytnVd9LhLiUu'
                     },
                     picture: {
                         originalName: 'user1.jpg',
                         size: 36023,
                         mimeType: 'image/png',
                         nameOnServer: 'cOObVhMSjSxTHiw4UWBdy28A2bvSaevn'
                     }
                 }
             }, {
                 _id: '56d979670c0ce24041304b3d',
                 name: 'User3',
                 userid: 'userid3xPYBs',
                 password: '*****',
                 organizationId: '56d979670c0ce24041304b3a',
                 created: 1457092967864,
                 status: 1,
                 __v: 0,
                 tokenGeneratedAt: 1457092968297,
                 token: '*****',
                 description: null,
                 departments: [],
                 groups: [],
                 avatar: {
                     thumbnail: {
                         originalName: 'user2.jpg',
                         size: 53586,
                         mimeType: 'image/png',
                         nameOnServer: 'AVa6NQdeKc83NPYvy9Y7G5RJdDKN6Fpw'
                     },
                     picture: {
                         originalName: 'user2.jpg',
                         size: 53586,
                         mimeType: 'image/png',
                         nameOnServer: 'druLJc3iituP5BAiHx7sNMmNuKkjd3rP'
                     }
                 }
             }]
         }
     }
 }
 
 **/

router.get("/:roomId", auth({ allowUser: true }), async function (request, response) {
  try {
    const roomId = request.params.roomId;
    if (!roomId) return Base.successResponse(response, Const.responsecodeNoRoomId);

    // find a room
    const room = await Room.findById(roomId).lean();
    if (!room) return Base.successResponse(response, Const.responsecodeNoRoomFound);

    const usersLimited = room.users;
    if (Array.isArray(usersLimited)) {
      room.users = usersLimited.slice(0, 4);
      const userFindResult = await User.find({ _id: { $in: room.users } }).lean();
      room.userModels = userFindResult;
    }

    const ownerModel = await User.findById(room.owner, {
      phoneNumber: 1,
      userName: 1,
      created: 1,
      avatar: 1,
      bankAccounts: 1,
    }).lean();

    if (ownerModel) {
      ownerModel._id = ownerModel._id.toString();
      room.ownerModel = ownerModel;
    }

    return Base.successResponse(response, Const.responsecodeSucceed, { room });
  } catch (error) {
    return Base.errorResponse(response, Const.httpCodeServerError, "RoomDetail", error);
  }
});

module.exports = router;
