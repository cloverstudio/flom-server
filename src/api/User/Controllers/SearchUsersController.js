"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { User } = require("#models");
const { formatUserDetailsResponse } = require("#logics");

/**
 * @api {post} /api/v2/users/search/id  Search users by user ids flom_v1
 * @apiVersion 2.0.20
 * @apiName  Search users by user ids
 * @apiGroup WebAPI User
 * @apiDescription  Search users by user ids.
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiParam {String[]}  userIds   Array of user ids to be found
 *
 * @apiUse UserSearchSuccessResponse
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443891 No userIds param
 * @apiError (Errors) 443892 Invalid userIds param
 * @apiError (Errors) 443893 Invalid userId - not object id
 * @apiError (Errors) 4000007 Token invalid
 */

router.post("/id", auth({ allowUser: true }), async function (request, response) {
  try {
    const { userIds } = request.body;

    if (!userIds) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeMissingUserIdsParam,
        message: "SearchUsersController, by id - no userIds param",
      });
    }

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidUserIdsParam,
        message: "SearchUsersController, by id - invalid userIds param",
      });
    }

    for (const id of userIds) {
      if (!Utils.isValidObjectId(id)) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidObjectIdNew,
          message: "SearchUsersController, by id - user id is not object id",
        });
      }
    }

    const users = await User.find({ _id: { $in: userIds }, "isDeleted.value": false }).lean();

    const usersMap = {};
    for (const user of users) {
      await formatUserDetailsResponse({ user });
      usersMap[user._id.toString()] = user;
    }

    const userProfiles = [];

    for (let i = 0; i < userIds.length; i++) {
      const user = usersMap[userIds[i]];
      userProfiles.push(user);
    }

    const responseData = { users: userProfiles };
    Base.successResponse(response, Const.responsecodeSucceed, responseData);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "SearchUsersController, by id",
      error,
    });
  }
});

/**
 * @api {post} /api/v2/users/search/phone  Search users by phone numbers flom_v1
 * @apiVersion 2.0.20
 * @apiName  Search users by phone numbers
 * @apiGroup WebAPI User
 * @apiDescription  Search users by phone numbers.
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiParam {String[]}  phoneNumbers   Array of user phone numbers to be found
 *
 * @apiUse UserSearchSuccessResponse
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443894 No phoneNumbers param
 * @apiError (Errors) 443895 Invalid phoneNumbers param
 * @apiError (Errors) 4000007 Token invalid
 */

router.post("/phone", auth({ allowUser: true }), async function (request, response) {
  try {
    const { phoneNumbers } = request.body;

    if (!phoneNumbers) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeMissingPhoneNumbersParam,
        message: "SearchUsersController, by phone numbers - no phoneNumbers param",
      });
    }

    if (!Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidPhoneNumbersParam,
        message: "SearchUsersController, by phone numbers - invalid phoneNumbers param",
      });
    }

    const users = await User.find({
      phoneNumber: { $in: phoneNumbers },
      "isDeleted.value": false,
    }).lean();

    const usersMap = {};
    for (const user of users) {
      await formatUserDetailsResponse({ user });
      usersMap[user.phoneNumber] = user;
    }

    const userProfiles = [];

    for (let i = 0; i < phoneNumbers.length; i++) {
      const user = usersMap[phoneNumbers[i]];
      userProfiles.push(user);
    }

    const responseData = { users: userProfiles };
    Base.successResponse(response, Const.responsecodeSucceed, responseData);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "SearchUsersController, by phone numbers",
      error,
    });
  }
});

module.exports = router;
