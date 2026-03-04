"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { Message, User } = require("#models");

/**
      * @api {get} /api/v2/message/undeliver/list/:chatId Get Undelivered Messages
      * @apiName Get Undelivered Messages
      * @apiGroup WebAPI
      * @apiDescription Get Undelivered Messages
      * 
      * @apiHeader {String} access-token Users unique access-token.
      * 
      * @apiSuccessExample Success-Response:
        {
            "code": 1,
            "time": 1457363319718,
            "data": {
                "messages": [
                    {
                        "seenBy": [
                            {
                                "user": "5a1eafc80ab9887733f0d1b6",
                                "at": 1516701042514,
                                "version": 2
                            },
                            {
                                "user": "59ee01d2064dd9956bc2a639",
                                "at": 1517567665236,
                                "version": 2
                            }
                        ],
                        "deliveredTo": [],
                        "_id": "5a54ba3e3594b1432d5ec8ce",
                        "userID": "59e899e085b675354ba8f15d",
                        "roomID": "2-5a183962156f083a372baebb",
                        "message": "ej",
                        "localID": "_bfhpANTSf7ijPJN51NKdPGwXnkkDyTrB",
                        "type": 1,
                        "attributes": {
                            "useclient": "web"
                        },
                        "created": 1515502142615,
                        "user": "59e899e085b675354ba8f15d",
                        "__v": 0
                    }
                ]
            }
        }
    
    **/

router.get("/:chatId", auth({ allowUser: true }), async function (request, response) {
  try {
    const chatId = request.params.chatId;
    const user = request.user;

    const users = await User.find({
      organizationId: user.organizationId,
      status: Const.userStatus.enabled,
    }).lean();

    const messageQuery = {
      userID: { $in: users.map((user) => user._id.toString()) },
      $or: [{ deliveredTo: { $exists: false } }, { deliveredTo: { $exists: true, $eq: [] } }],
    };
    if (chatId) messageQuery.roomID = chatId;

    const messages = await Message.find(messageQuery).sort({ created: "desc" }).limit(100).lean();
    const populatedMessages = await Message.populateMessages(messages);

    return Base.successResponse(response, Const.responsecodeSucceed, {
      messages: populatedMessages,
    });
  } catch (error) {
    return Base.errorResponse(
      response,
      Const.httpCodeServerError,
      "UndeliverMessageListController",
      error,
    );
  }
});

module.exports = router;
