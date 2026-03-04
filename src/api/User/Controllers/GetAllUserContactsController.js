"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { User, UserContact, History } = require("#models");

/**
 * @api {post} /api/v2/user/getAllUserContacts Get all user contacts
 * @apiName Get all user contacts
 * @apiGroup WebAPI
 * @apiDescription Get all user contacts
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {String} userId userId
 * @apiSuccessExample Success-Response:
 */

router.post("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const userId = request.body.userId;
    const keyword = request.body.keyword;

    if (!userId) return Base.successResponse(response, Const.responsecodeNoUserId);

    let result = {};

    let userContacts = await UserContact.find({ userId: userId });
    let userHistory = await History.find({ userId: userId, ownerRemoved: null });

    let allUserIds = [];

    userContacts.forEach((contact) => {
      if (contact.contactId !== userId) allUserIds.push(contact.contactId);
    });

    userHistory.forEach((history) => {
      if (history.chatId !== userId) allUserIds.push(history.chatId);
    });

    let conditions = {
      _id: { $in: allUserIds },
    };

    if (keyword) {
      conditions["$or"] = [
        { name: new RegExp("^.*" + Utils.escapeRegExp(keyword) + ".*$", "i") },
        { sortName: new RegExp("^.*" + Utils.escapeRegExp(keyword) + ".*$", "i") },
        { description: new RegExp("^.*" + Utils.escapeRegExp(keyword) + ".*$", "i") },
      ];
    }

    let allUsers = await User.find(conditions);

    result.list = allUsers.map((user) => user.toObject());

    return Base.successResponse(response, Const.responsecodeSucceed, result);
  } catch (e) {
    Base.errorResponse(response, Const.httpCodeServerError, "GetAllUserContactsController", e);
    return;
  }
});

module.exports = router;
