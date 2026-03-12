"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { FlomMessage, Favorite } = require("#models");
const { populateMessages } = require("#logics");

router.get("/:chatId/:page", auth({ allowUser: true }), async function (request, response) {
  try {
    const page = +request.params.page - 1;
    const chatId = request.params.chatId;
    const userId = request.user._id.toString();

    const query = {
      userId,
      roomId: chatId,
    };

    const favorites = await Favorite.find(query)
      .sort({ created: "desc" })
      .skip(Const.pagingRows * page)
      .limit(Const.pagingRows)
      .lean();

    const messageIds = favorites.map((favorite) => favorite.messageId);
    const messages = await FlomMessage.find({ _id: { $in: messageIds } }).lean();
    const populatedMessages = await populateMessages(messages, request.user);

    const messagesMap = {};
    populatedMessages.forEach((message) => {
      messagesMap[message._id.toString()] = message;
    });

    favorites.forEach((favorite) => {
      favorite.Message = messagesMap[favorite.messageId.toString()];
    });

    return Base.successResponse(response, Const.responsecodeSucceed, {
      favorites,
      count: favorites.length,
    });
  } catch (error) {
    return Base.errorResponse(
      response,
      Const.httpCodeServerError,
      "FavoriteListByChatController",
      error,
    );
  }
});

module.exports = router;
