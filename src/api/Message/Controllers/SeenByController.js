"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
// const { auth } = require("#middleware");
const { Message, User } = require("#models");

/**
 * @api {get} /api/v2/message/seenby/messageid Get list of users who've seen the message
 * @apiName Get SeenBy
 * @apiGroup WebAPI
 * @apiDescription Returns array of user model
 **/

router.get("/:messageid", async function (request, response) {
  try {
    const messageId = request.params.messageid;

    if (!Utils.isObjectId(messageId)) {
      return Base.successResponse(response, Const.responsecodeForwardMessageInvalidChatId);
    }

    const message = await Message.findById(messageId).lean();

    if (!message) {
      return Base.successResponse(response, Const.responsecodeForwardMessageInvalidChatId);
    }

    const seenByUserIds = message.seenBy.map((item) => item.user);
    const deliveredToUserIds = message.deliveredTo.map((item) => item.userId);

    const userIds = [...new Set([...seenByUserIds, ...deliveredToUserIds])].filter((str) =>
      Utils.isObjectId(str),
    );

    const users = await User.find(
      { _id: { $in: userIds } },
      User.getDefaultResponseFields(),
    ).lean();

    const seenByAry = message.seenBy.map((obj) => {
      const user = users.find((userRow) => userRow._id.toString() === obj.user);
      return { ...obj, user };
    });
    const deliveredToAry = message.deliveredTo.map((obj) => {
      const user = users.find((userRow) => userRow._id.toString() === obj.userId);
      return { ...obj, user };
    });

    return Base.successResponse(response, Const.responsecodeSucceed, {
      seenBy: seenByAry,
      deliveredTo: deliveredToAry,
    });
  } catch (error) {
    return Base.errorResponse(response, Const.httpCodeServerError, "SeenByController", error);
  }
});

module.exports = router;
