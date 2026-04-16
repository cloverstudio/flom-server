"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Config, Const } = require("#config");
const Utils = require("#utils");
const { AdminPageUser } = require("#models");

const { sendVerificationEmail } = require("../helpers/sendEmail");
const { validateAndGetUser } = require("../helpers/validateData");

/**
 * @api {post} /api/v2/admin-page/email/verify Admin page verify email
 * @apiVersion 2.0.9
 * @apiName Admin page verify email
 * @apiGroup WebAPI Admin page
 * @apiDescription API used for verifying admin page users email. After verifying email users will get role 100, unless he had higher role before.
 * If user is verifying email by clicking the link then instead of userId and code you should send the token from the email to this API.
 *
 * @apiParam {String} [userId] Id of the user whose email if verified
 * @apiParam {String} [code] 6 number code user received in the email
 * @apiParam {String} [token] Alternative email verification method. Used instead of userId and code
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1590000125608,
 *   "version": {
 *     "update": 1, // 0 - no update, 1 - optional update
 *     "popupHiddenLength": 24 // in hours
 *   },
 *   "data": {}
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 443001 Username taken
 * @apiError (Errors) 443218 UserId is not a valid id
 * @apiError (Errors) 443219 No code
 * @apiError (Errors) 443387 Invalid or expired code
 * @apiError (Errors) 4000110 No userId
 * @apiError (Errors) 4000760 User not found
 */

router.post("/verify", async (request, response) => {
  try {
    const { userId, code, token } = request.body;

    let user;
    if (token) {
      user = await AdminPageUser.findOne({ "emailVerification.token": token });
      if (!user) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeUserNotFound,
          type: Const.logTypeAdminPage,
          message: "EmailVerificationController - verify code, user not found",
        });
      }
    } else {
      const validateAndGetUserResult = await validateAndGetUser(userId);

      const { code: errorCode, message } = validateAndGetUserResult;
      if (errorCode) {
        return Base.newErrorResponse({
          response,
          code: errorCode,
          type: Const.logTypeAdminPage,
          message: `EmailVerificationController - verify code, ${message}`,
        });
      }
      user = validateAndGetUserResult.user;

      if (!code) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeNoCode,
          type: Const.logTypeAdminPage,
          message: "EmailVerificationController - verify code, no code",
        });
      }
    }

    if (user.emailVerification.verified) {
      return Base.successResponse(response, Const.responsecodeSucceed);
    }

    if (
      (code && code !== user.emailVerification.code) ||
      (token && token !== user.emailVerification.token) ||
      Date.now() - user.emailVerification.emailOut > Config.expireTimeForEmail
    ) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidCode,
        type: Const.logTypeAdminPage,
        message: "EmailVerificationController - verify code, invalid code or code expired",
      });
    }

    user.emailVerification.verified = true;
    if (user.role === Const.Role.INITIAL) {
      user.role = Const.Role.EMAIL_VERIFIED;
    }
    await user.save();

    Base.successResponse(response, Const.responsecodeSucceed);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "EmailVerificationController - verify code",
      type: Const.logTypeAdminPage,
      error,
    });
  }
});

/**
 * @api {post} /api/v2/admin-page/email/resend Admin page resend email code
 * @apiVersion 2.0.9
 * @apiName Admin page resend email code
 * @apiGroup WebAPI Admin page
 * @apiDescription API used for resending email verification code. If optional email parameter is present then users email will be updated and
 * new verification email will be sent to that email address.
 *
 * @apiBody {String} userId Id of the user
 * @apiBody {String} [email] New users email
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1590000125608,
 *   "version": {
 *     "update": 1, // 0 - no update, 1 - optional update
 *     "popupHiddenLength": 24 // in hours
 *   },
 *   "data": {
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 443218 UserId is not a valid id
 * @apiError (Errors) 4000110 No userId
 * @apiError (Errors) 4000760 User with userId not found
 */

router.post("/resend", async (request, response) => {
  try {
    const { userId, email } = request.body;

    const { code, message, user } = await validateAndGetUser(userId);
    if (code) {
      return Base.newErrorResponse({
        response,
        code,
        type: Const.logTypeAdminPage,
        message: `EmailVerificationController - resend, ${message}`,
      });
    }

    if (user.emailVerification.verified) {
      return Base.successResponse(response, Const.responsecodeSucceed);
    }

    if (email) {
      user.email = email;
    }

    const { emailCode, emailToken } = sendVerificationEmail({ email: user.email });

    user.emailVerification.code = emailCode;
    user.emailVerification.token = emailToken;
    user.emailVerification.emailOut = Date.now();
    await user.save();

    Base.successResponse(response, Const.responsecodeSucceed);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "EmailVerificationController - resend",
      type: Const.logTypeAdminPage,
      error,
    });
  }
});

module.exports = router;
