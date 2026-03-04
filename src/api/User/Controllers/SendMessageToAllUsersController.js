"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { User } = require("#models");
const { sendMessage } = require("#logics");

/**
     * @api {post} /api/v2/message/send Send Message
     * @apiName SendMessage
     * @apiGroup WebAPI
     * @apiDescription Returns messageobj
     * @apiHeader {String} access-token Users unique access-token.
     
     * @apiParam {String} roomID roomID
     * @apiParam {String} message message
     * @apiParam {String} type message type
     * @apiParam {String} file.file file( if eixsts)
     * @apiParam {String} file.thumb thumb ( if picture )
     * @apiSampleRequest 
{
  "file": {
    "file": {
      "size": "1504586",
      "name": "test.jpg",
      "mimeType": "image/jpeg",
      "id": "5730a5edf5c6e3123d09c85f"
    },
    "thumb": {
      "size": "33000",
      "name": "thumb_2014-06-03 17.23.39.jpg\"",
      "mimeType": "image/jpeg",
      "id": "5730a5eef5c6e3123d09c860"
    }
  },
  "roomID": "1-56ec126ca4718ef424641692-572b3fdd52ae03995757478e",
  "type": "2"
}

     * @apiSuccessExample Success-Response:
{
	"code": 1,
	"time": 1462805270534,
	"data": {
		"message": {
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
	}
}

**/

router.post("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const message = request.body.message;
    const admin = request.user;
    const permission = request.user.permission;

    if (!message || permission !== 2) {
      return Base.successResponse(response, Const.responsecodeFailedToSendMessage, {});
    }

    const allUsers = await User.find({ status: 1, isAppUser: true, shadow: false });

    const promises = allUsers.map((user) => {
      const roomID = Utils.chatIdByUser(user, admin);
      return sendMessage({
        roomID,
        message,
        type: 1,
        userID: admin._id.toString(),
        plainTextMessage: true,
      });
    });

    await Promise.all(promises);

    Base.successResponse(response, Const.responsecodeSucceed, {
      messagesSent: allUsers.length,
    });
  } catch (error) {
    Base.successResponse(response, Const.responsecodeFailedToSendMessage, {});
  }
});

module.exports = router;
