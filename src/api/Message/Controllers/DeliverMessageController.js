"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { FlomMessage } = require("#models");
const { socketApi } = require("#sockets");
const { updateHistory } = require("#logics");

/**
      * @api {post} /api/v2/message/deliver Update Messages Delivered To 
      * @apiName Update Messages Delivered To 
      * @apiGroup WebAPI
      * @apiDescription 

      * @apiHeader {String} access-token Users unique access-token.

      * @apiParam {String} messageIds messageIds

      * @apiSuccessExample Success-Response:
        {
            "code": 1,
            "time": 1457363319718,
            "data": {}
        }
    **/

router.post("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const messageIds = request.body.messageIds;
    const messageId = request.body.messageId;
    const user = request.user;
    if (!messageIds && !messageId) {
      return Base.successResponse(response, Const.responsecodeDeliverMessageNoMessageId);
    }

    const ids = messageIds ? messageIds.split(",").map((id) => id.trim()) : [messageId];

    const messages = await FlomMessage.find({ _id: { $in: ids } }).lean();
    if (messages.length === 0) {
      return Base.successResponse(response, Const.responsecodeDeliverMessageWrongMessageId);
    }

    const undeliveredMessages = messages.filter(
      (message) => !message.deliveredTo.some((delivery) => delivery.userId === user._id.toString()),
    );
    if (undeliveredMessages.length === 0) {
      return Base.successResponse(response, Const.responsecodeSucceed);
    }

    const deliveredToRow = {
      userId: user._id.toString(),
      at: Date.now(),
    };

    await FlomMessage.updateMany(
      { _id: { $in: undeliveredMessages.map((message) => message._id) } },
      { $push: { deliveredTo: deliveredToRow } },
      { multi: true },
    );

    messages.forEach((message) => {
      const isDelivered = message.sentTo.length === message.deliveredTo.length + 1; // +1 for the current delivery
      updateHistory.updateLastMessageStatus({
        messageId: message._id.toString(),
        delivered: isDelivered,
      });
    });

    const res = await FlomMessage.populateMessages(undeliveredMessages);
    const roomIds = [...new Set(res.map((message) => message.roomID))];

    roomIds.forEach((roomId) => {
      const chatType = roomId.split("-")[0];
      const filterMessages = res.filter((message) => message.roomID === roomId);

      if (chatType === Const.chatTypeGroup || chatType === Const.chatTypeRoom) {
        socketApi.flom.emitToRoom(roomId, "updatemessages", filterMessages);
      } else if (chatType === Const.chatTypePrivate) {
        const splitAry = roomId.split("-");
        if (splitAry.length < 2) return;

        let fromUser = splitAry[1];
        let toUser = splitAry[2];

        if (fromUser !== user._id.toString()) {
          [fromUser, toUser] = [toUser, fromUser];
        }

        socketApi.flom.emitToRoom(toUser, "updatemessages", filterMessages);
        socketApi.flom.emitToRoom(fromUser, "updatemessages", filterMessages);
      }
    });

    return Base.successResponse(response, Const.responsecodeSucceed);
  } catch (error) {
    return Base.errorResponse(
      response,
      Const.httpCodeServerError,
      "DeliverMessageController",
      error,
    );
  }
});

module.exports = router;
