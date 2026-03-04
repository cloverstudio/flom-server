"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { User } = require("#models");

/**
 * @api {patch} /api/v2/users/international/:userId Set user's international status
 * @apiVersion 2.0.10
 * @apiName Set user's international status
 * @apiGroup WebAPI User
 * @apiDescription API for setting user's international status.
 *
 * @apiHeader {String} access-token Users unique access-token. Only admin token allowed.
 *
 * @apiParam {Boolean} internationalUser user's international status - true or false
 *
 * @apiSuccessExample {json} Success-Response:
 * {
 *   "code": 1,
 *   "time": 1624535998267,
 *   "data": {
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443230 Invalid userId parameter
 * @apiError (Errors) 443640 Invalid internationalUser parameter
 * @apiError (Errors) 4000007 Token not valid
 * @apiError (Errors) 4000110 No userId parameter
 * @apiError (Errors) 4000760 User with userId not found
 */

router.patch(
  "/:userId",
  auth({ allowAdmin: true, role: Const.Role.ADMIN }),
  async (request, response) => {
    try {
      const { internationalUser } = request.body;
      const userId = request.params.userId;
      if (!userId) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeNoUserId,
          message: `SetInternationalUserFlagController, no userId parameter`,
        });
      }
      if (internationalUser !== true && internationalUser !== false) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidInternationalUserParameter,
          message: `SetInternationalUserFlagController, invalid internationalUser parameter`,
        });
      }

      if (!Utils.isValidObjectId(userId)) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidUserId,
          message: `SetInternationalUserFlagController, invalid userId parameter`,
        });
      }

      const user = await User.findOne({ _id: userId });
      if (!user) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeUserNotFound,
          message: `SetInternationalUserFlagController, user with id ${userId} not found`,
        });
      }

      user.internationalUser = internationalUser;
      await user.save();

      Base.successResponse(response, Const.responsecodeSucceed);
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "SetInternationalUserFlagController",
        error,
      });
    }
  },
);

module.exports = router;
