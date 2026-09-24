"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { History } = require("#models");

/**
      * @api {post} /api/v2/user/pin pin / unpin chat
      * @apiName pin / unpin chat
      * @apiGroup WebAPI
      * @apiDescription pin / unpin chat
      * @apiHeader {String} access-token Users unique access-token.
 
      * @apiParam {Number} pin 1 = pin, 0 = unpin
      * @apiParam {String} chatId chatId (one or more chatIds separated by ,)
      
      * @apiSuccessExample Success-Response:
 {}
 
 **/

router.post("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const pin = request.body.pin;
    let chatId = request.body.chatId;
    const user = request.user;

    if (pin != 0 && pin != 1) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodePinChatWrongPinParam,
        message: "PinController, wrong pin parameter",
      });
    }

    if (!chatId) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodePinChatWrongChatIdParam,
        message: "PinController, wrong chatId parameter",
      });
    }

    chatId = chatId.split(",").map((id) => {
      return id.trim();
    });

    await History.updateMany(
      { userId: user._id.toString(), chatId: { $in: chatId } },
      { pinned: pin == 1 ? true : false },
      { multi: true },
    );

    return Base.successResponse(response, Const.responsecodeSucceed);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "PinController",
      error,
    });
  }
});

module.exports = router;
