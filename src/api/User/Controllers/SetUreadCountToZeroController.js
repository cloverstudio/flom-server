"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { History } = require("#models");

/**
		* @api {post} /api/v2/user/history/setunreadtozero Set unread count to zero
		* @apiName Set unread count to zero
		* @apiGroup WebAPI
		* @apiDescription Set unread count to zero
		* @apiHeader {String} access-token Users unique access-token.
		* @apiParam {String} chatId
    * @apiParam {String} historyId
    * @apiParam {String} unreadCount
		* @apiSuccessExample Success-Response:
		{
		    "code": 1,
		    "time": 1584549370393,
		    "data": {}
		}

**/

router.post("/", auth({ allowUser: true }), async function (request, response) {
  const chat = request.body.chatId;
  const historyId = request.body.historyId;
  const unreadCount = request.body.unreadCount || 0;

  if (!Utils.isPositiveInteger(unreadCount)) {
    return Base.successResponse(response, Const.responsecodeInvalidUnreadCount);
  }

  if (!chat && !historyId) {
    return Base.successResponse(response, Const.responsecodeNoChatIdOrHistoryId);
  }

  if (historyId) {
    try {
      let history = await History.findOne({ _id: historyId });

      if (!history) {
        return Base.successResponse(response, Const.responsecodeHistoryNotFound);
      }

      history.unreadCount = unreadCount;
      history.lastUpdateUnreadCount = Date.now();
      await history.save();

      return Base.successResponse(response, Const.responsecodeSucceed);
    } catch (error) {
      console.error("Error in setunredcount to 0: ", { error });
      return Base.successResponse(response, Const.responsecodeHistoryNotFound);
    }
  } else {
    try {
      const chatSplit = chat.split("-");

      let chatType = chatSplit[0];
      let chatId = chatSplit[1];
      let userId = request.user._id.toString();

      if (
        chatType == Const.chatTypeGroup ||
        chatType == Const.chatTypeBroadcastAdmin ||
        chatType == Const.chatTypeRoom
      ) {
        if (chatSplit.length !== 2) {
          return Base.successResponse(response, Const.responsecodeChatIdNotFound);
        }
      } else {
        if (chatSplit.length !== 3) {
          return Base.successResponse(response, Const.responsecodeChatIdNotFound);
        }
        if (chatId == userId) {
          chatId != chatSplit[1] ? (chatId = chatSplit[1]) : (chatId = chatSplit[2]);
        }
      }

      let queryObject = {
        chatType,
        chatId,
        userId,
      };

      let history = await History.findOne(queryObject);

      if (!history) {
        return Base.successResponse(response, Const.responsecodeHistoryNotFound);
      }

      history.unreadCount = unreadCount;
      history.lastUpdateUnreadCount = Date.now();
      await history.save();

      return Base.successResponse(response, Const.responsecodeSucceed);
    } catch (error) {
      return Base.successResponse(response, Const.responsecodeHistoryNotFound);
    }
  }
});

module.exports = router;
