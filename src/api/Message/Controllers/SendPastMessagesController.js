"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { sendMessage } = require("#logics");

/**
     * @api {post} /api/v2/message/send-past Send Past Messages
     * @apiName SendPastMessages
     * @apiGroup WebAPI
     * @apiDescription Returns array of messagesobj
     * @apiHeader {String} access-token Users unique access-token.
		 
		 * @apiParam {Array} messages messages - array with message object (bellow)
     * @apiParam {String} message.roomID roomID
     * @apiParam {String} message.message message
     * @apiParam {Number} message.created created - epoch in milliseconds
     * @apiSampleRequest 
		 * 
				{
						"messages": [
								{
										"roomID": "3-5f44eb4b016f1051a8527212",
										"message": "kul2",
										"created": 1599560897000
								}
						]
				}

     * @apiSuccessExample Success-Response:
				{
					"code": 1,
					"time": 1462805270534,
					"data": {
						"messages": [
							{
								"__v": 0,
								"user": "56ec127aa4718ef424641693",
								"userID": "56ec126ca4718ef424641692",
								"roomID": "1-56ec126ca4718ef424641692-572b3fdd52ae03995757478e",
								"message": "test",
								"type": 1,
								"created": 1462805270529,
								"_id": "5730a316cce6a28d3afd8eee",
								"seenBy": []
							}
						]
					}
				}

**/

router.post("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const { messages } = request.body;

    if (!messages) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeMessagesMustBeDefined,
        message: `SendPastMessagesController, messages must be defined`,
      });
    }

    if (!Array.isArray(messages)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeMessagesMustBeArray,
        message: `SendPastMessagesController, messages must be an array`,
      });
    }

    if (messages.length === 0) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeMessagesMustContainAtLeastOneObject,
        message: `SendPastMessagesController, messages must contain at least one object`,
      });
    }

    for (let i = 0; i < messages.length; i++) {
      const messageObj = messages[i];
      const { roomID, message, created } = messageObj;
      if (!roomID) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeAllMessagesObjectMustContainRoomID,
          message: `SendPastMessagesController, all messages object must contain roomID`,
        });
      }
      if (!message) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeAllMessagesObjectMustContainMessage,
          message: `SendPastMessagesController, all messages object must contain message`,
        });
      }
      if (!created) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeAllMessagesObjectMustContainCreated,
          message: `SendPastMessagesController, all messages object must contain created`,
        });
      }
    }

    const promises = messages.map((m) =>
      sendMessage({
        ...m,
        plainTextMessage: true,
        userID: request.user._id.toString(),
        type: Const.messageTypeText,
      }),
    );

    const sentMessages = await Promise.allSettled(promises);

    return Base.successResponse(response, Const.responsecodeSucceed, { messages: sentMessages });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "SendPastMessagesController",
      error,
    });
  }
});

module.exports = router;
