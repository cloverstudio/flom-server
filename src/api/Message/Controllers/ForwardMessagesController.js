"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { sendMessage } = require("#logics");

router.post("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const messages = request.body.messages;
    const userId = request.user._id.toString();

    const messageList = [];

    if (!Array.isArray(messages)) {
      return Base.errorResponse({
        response,
        code: Const.responsecodeForwardMessageInvalidMessageId,
        message: "ForwardMessagesController, messages is not an array",
      });
    }

    for (const message of messages) {
      message.userID = userId;

      const messageObj = await sendMessage(message);

      if (messageObj && messageObj._id) {
        messageList.push({ _id: messageObj._id.toString(), created: messageObj.created });
      }
    }

    return Base.successResponse(response, Const.responsecodeSucceed, { messages: messageList });
  } catch (error) {
    Base.errorResponse({
      response,
      message: "ForwardMessagesController",
      error,
    });
  }
});

module.exports = router;
