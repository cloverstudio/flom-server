"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { encryptionManager } = require("#infra");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { FlomMessage } = require("#models");
const { sendMessage } = require("#logics");

/**
      * @api {post} /api/v2/message/forward Forward Message
      * @apiName ForwardMessage
      * @apiGroup WebAPI
      * @apiDescription Returns forward message
      * @apiHeader {String} access-token Users unique access-token.
      * @apiParam {string} messageId messageId
      * @apiParam {string} roomId roomId  ( exp: 1-56cd9c45b84f5a1b393abb8f-56cdd6a358501da66d73a5dc)
      * @apiSuccessExample Success-Response:
 
 {
     "code": 1,
     "time": 1458051079100,
     "data": {
         "message": {
             "__v": 0,
             "user": "56c32ae5331dd81f8134f201",
             "userID": "56c32acd331dd81f8134f200",
             "roomID": "3-56e7e9e138a97a86db83f3cf",
             "message": "",
             "localID": "_roIF6lUllHg4RboTEr70iJHntIAuPLCc",
             "type": 2,
             "created": 1458051079096,
             "_id": "56e818070f2ba9df173e6289",
             "seenBy": [],
             "file": {
                 "thumb": {
                     "id": "56e8152b31906da71481643b",
                     "name": "thumb_2014-06-03 17.23.38.jpg",
                     "size": 32200.000000000004,
                     "mimeType": "image/jpeg"
                 },
                 "file": {
                     "id": "56e8152b31906da71481643a",
                     "name": "2014-06-03 17.23.38.jpg",
                     "size": 1438407,
                     "mimeType": "image/jpeg"
                 }
             }
         }
     }
 }
 
 **/

router.post("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const roomId = request.body.roomId;
    const messageId = request.body.messageId;

    if (!roomId || roomId == "") {
      return Base.successResponse(response, Const.responsecodeForwardMessageInvalidChatId);
    }

    if (!messageId || messageId == "") {
      return Base.successResponse(response, Const.responsecodeForwardMessageInvalidMessageId);
    }

    const message = await FlomMessage.findById(messageId).lean();
    if (!message) {
      return Base.successResponse(response, Const.responsecodeForwardMessageInvalidMessageId);
    }

    const messageParam = { ...message };
    messageParam.roomID = roomId;
    messageParam.localID = "";
    messageParam.userID = request.user._id.toString();

    // encrypt if text
    if (messageParam.type == Const.messageTypeText) {
      messageParam.message = encryptionManager.encryptText(messageParam.message);
    }

    const result = await sendMessage(messageParam);

    return Base.successResponse(response, Const.responsecodeSucceed, { message: result });
  } catch (error) {
    return Base.errorResponse(
      response,
      Const.httpCodeServerError,
      "ForwardMessageController",
      error,
    );
  }
});

module.exports = router;
