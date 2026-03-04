"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { User } = require("#models");

/**
 * @api {patch} /api/v2/admin-page/user/:userId Update users details flom_v1
 * @apiVersion 2.0.26
 * @apiName  Update users details flom_v1
 * @apiGroup WebAPI Admin page
 * @apiDescription  Update users details
 *
 * @apiHeader {String} access-token Users unique access token. Only super-admin token allowed.
 *
 * @apiParam (Request body) {String}  [userName]     New username
 * @apiParam (Request body) {Number}  [payoutLimit]  Payout limit for user, to remove limit send -1
 *
 * @apiSuccessExample Success Response
 * {
 *   "code": 1,
 *   "time": 1590000125608,
 *   "data": {}
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443030 Invalid userId
 * @apiError (Errors) 443040 User not found
 * @apiError (Errors) 400271 Username missing
 * @apiError (Errors) 430530 Username already taken
 * @apiError (Errors) 430531 Username too short
 * @apiError (Errors) 430535 Invalid chars used
 * @apiError (Errors) 4000007 Token invalid
 */

router.patch(
  "/:userId",
  auth({ allowAdmin: true, role: Const.Role.SUPER_ADMIN }),
  async function (request, response) {
    try {
      const userId = request.params.userId;
      if (!userId || !Utils.isValidObjectId(userId)) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeUserIdNotValid,
          message: "UpdateUserDetailsController, invalid userId: " + userId,
        });
      }

      const { userName, payoutLimit } = request.body;

      const updateObj = {};

      if (userName) {
        if (userName.length < 3) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeUsernameTooShort,
            message: "UpdateUserDetailsController, username too short: " + userName,
          });
        }

        const regexTerminalCode = /[^0-9]/g;
        if (!userName.match(regexTerminalCode)) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeUsernameInvalidCharsUsed,
            message: "UpdateUserDetailsController, invalid chars: " + userName,
          });
        }

        const userNameRegex = new RegExp(`^${userName}$`, "i");
        const result = await User.findOne({ userName: userNameRegex }).lean();

        if (result) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeUsernameNotAvailable,
            message: "UpdateUserDetailsController, username taken: " + userName,
          });
        }

        updateObj.userName = userName;
        updateObj.name = userName;
      }

      if (payoutLimit !== undefined && typeof payoutLimit === "number") {
        if (payoutLimit < 0) {
          updateObj.$unset = { payoutLimit: 1 };
        } else {
          updateObj.payoutLimit = payoutLimit;
        }
      }

      const user = await User.findByIdAndUpdate(userId, updateObj, {
        new: true,
        lean: true,
      });

      if (!user) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeUserNotFound,
          message: "UpdateUserDetailsController, user not found: " + userId,
        });
      }

      Base.successResponse(response, Const.responsecodeSucceed);
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "UpdateUserDetailsController",
        error,
      });
    }
  },
);

module.exports = router;
