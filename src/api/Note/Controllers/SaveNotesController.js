"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { Note } = require("#models");

/**
      * @api {post} /api/v2/note/save Save Notes for chat
      * @apiName AddToFavorite
      * @apiGroup WebAPI
      * @apiDescription Add to callers favorite
      * @apiHeader {String} access-token Users unique access-token.
      * @apiParam {string} chatId chatId
      * @apiParam {string} note note
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
             "modified": "1457363319710"
         }
     }
 }
 
 **/

router.post("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const chatId = request.body.chatId;

    if (!chatId) {
      Base.successResponse(response, Const.resCodeSaveNoteNoChatID);
      return;
    }

    const savedNote = await Note.findOneAndUpdate(
      { chatId: chatId },
      { note: request.body.note, modified: Date.now() },
      { upsert: true, new: true, lean: true },
    );

    return Base.successResponse(response, Const.responsecodeSucceed, { note: savedNote });
  } catch (error) {
    Base.errorResponse(response, Const.httpCodeServerError, "SaveNotesController", error);
    return;
  }
});

module.exports = router;
