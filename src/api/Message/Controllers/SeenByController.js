"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { FlomMessage, User } = require("#models");

/**
 * @api {get} /api/v2/message/seenby/messageid Get list of users who've seen the message
 * @apiName Get SeenBy
 * @apiGroup WebAPI
 * @apiDescription Returns array of user model
 **/

router.get("/:messageid", auth({ allowUser: true }), async function (request, response) {
  try {
    const messageId = request.params.messageid;

    if (!Utils.isValidObjectId(messageId)) {
      return Base.successResponse(response, Const.responsecodeForwardMessageInvalidChatId);
    }

    const message = await FlomMessage.findById(messageId).lean();

    if (!message) {
      return Base.successResponse(response, Const.responsecodeForwardMessageInvalidChatId);
    }

    const seenByUserIds = message.seenBy
      .map((item) => {
        if (item.user && Utils.isValidObjectId(item.user)) {
          return item.user;
        } else if (item.userId && Utils.isValidObjectId(item.userId)) {
          return item.userId;
        }
        return null;
      })
      .filter((id) => id !== null);

    const deliveredToUserIds = message.deliveredTo
      .map((item) => {
        if (item.user && Utils.isValidObjectId(item.user)) {
          return item.user;
        } else if (item.userId && Utils.isValidObjectId(item.userId)) {
          return item.userId;
        }
        return null;
      })
      .filter((id) => id !== null);

    const userIds = [...new Set([...seenByUserIds, ...deliveredToUserIds])].filter((str) =>
      Utils.isValidObjectId(str),
    );

    const users = await User.find(
      { _id: { $in: userIds } },
      User.getDefaultResponseFields(),
    ).lean();
    const userMap = {};
    users.forEach((user) => {
      userMap[user._id.toString()] = user;
    });

    const seenByCheckAry = [];
    const deliveredToCheckAry = [];

    const seenByAry = message.seenBy
      .map((obj) => {
        const user = userMap[obj.user] || userMap[obj.userId];
        delete obj.user;
        delete obj.userId;
        return { ...obj, user, userId: user ? user._id : null };
      })
      .filter((item) => {
        if (item.userId !== null && !seenByCheckAry.includes(item.userId)) {
          seenByCheckAry.push(item.userId);
          return true;
        }
        return false;
      });
    const deliveredToAry = message.deliveredTo
      .map((obj) => {
        const user = userMap[obj.user] || userMap[obj.userId];
        delete obj.user;
        delete obj.userId;
        return { ...obj, user, userId: user ? user._id : null };
      })
      .filter((item) => {
        if (item.userId !== null && !deliveredToCheckAry.includes(item.userId)) {
          deliveredToCheckAry.push(item.userId);
          return true;
        }
        return false;
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
