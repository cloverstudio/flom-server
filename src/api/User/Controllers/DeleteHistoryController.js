"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { History } = require("#models");

router.post("/", auth({ allowUser: true }), async function (request, response) {
  try {
    let chatIds = request.body.chatIds;

    if (!chatIds) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeDeleteHistoryNoChatId,
        message: "DeleteHistoryController, no chatIds provided",
      });
    }

    chatIds = chatIds.split(",").map((id) => {
      return id.trim();
    });

    await History.updateMany(
      { userId: request.user._id.toString(), chatId: { $in: chatIds } },
      { $set: { isDeleted: true } },
      { multi: true },
    );

    return Base.successResponse(response, Const.responsecodeSucceed);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "DeleteHistoryController",
      error,
    });
  }
});

module.exports = router;
