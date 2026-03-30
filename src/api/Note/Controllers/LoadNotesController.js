"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { User, Room, Group, Note } = require("#models");

/**
	 * @apiIgnore
      * @api {get} /api/v2/note/list/:chatId load notes for the chat
      * @apiName AddToFavorite
      * @apiGroup WebAPI
      * @apiDescription Add to callers favorite
      * @apiHeader {String} access-token Users unique access-token.
      * @apiParam {string} chatId chatId
      * @apiSuccessExample Success-Response:
 {
     "code": 1,
     "time": 1457363319718,
     "data": {
         "note": {
             "__v": 0,
             "chatId": "1-56c32acd331dd81f8134f200-56c32acd331dd81f8134f200",
             "note": "text",
             "created": 1457363319710,
             "modified": "1457363319710",
             "name": "Pero"
         }
     }
 }
 
 **/

router.get("/:chatId", auth({ allowUser: true }), async function (request, response) {
  try {
    const chatId = request.params.chatId;

    let result = {};

    let arr = chatId.split("-");
    const chatType = arr[0];
    const userId = arr[1];
    const chat = arr[2];

    const note = await Note.findOne({ chatId: chatId });

    if (!note) {
      return Base.successResponse(response, Const.responsecodeSucceed);
    }

    result.note = note.toObject();

    let name;

    if (chatType === "1") {
      let user = await User.findOne({ _id: chat });
      name = user.name;
    } else if (chatType === "2") {
      let group = await Group.findOne({ _id: userId });
      name = group.name;
    } else if (chatType === "3") {
      let room = await Room.findOne({ _id: userId });
      name = room.name;
    }

    result.note.name = name;

    Base.successResponse(response, Const.responsecodeSucceed, {
      note: result.note,
    });
  } catch (error) {
    Base.errorResponse(response, Const.httpCodeServerError, "LoadNotesController", error);
    return;
  }
});

module.exports = router;
