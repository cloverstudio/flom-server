"use strict";

const bcrypt = require("bcrypt");
const router = require("express").Router();
const Base = require("../../Base");
const { Config, Const } = require("#config");
const Utils = require("#utils");
const { AdminPageUser } = require("#models");
const { sendResetPasswordEmail } = require("../helpers/sendEmail");

/**
 * @api {post} /api/v2/admin-page/password-reset Send password reset email
 * @apiVersion 2.0.10
 * @apiName Send password reset email
 * @apiGroup WebAPI Admin page
 * @apiDescription API for requesting email for resetting users password
 *
 * @apiParam {String} reCaptcha reCaptcha token to verify
 * @apiParam {String} username Users username
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1641819141913,
 *   "data": {
 *     "emailSend": true
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 443210 No username parameter
 * @apiError (Errors) 443212 Wrong username
 * @apiError (Errors) 443389 Email not verified
 * @apiError (Errors) 443400 No reCaptcha parameter
 * @apiError (Errors) 443401 reCaptcha failed
 */

router.post("/", async (request, response) => {
  try {
    const { reCaptcha, username } = request.body;

    if (!reCaptcha) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoReCaptchaParameter,
        type: Const.logTypeAdminPage,
        message: "PasswordResetController - send reset password email, no reCaptcha parameter",
      });
    }

    const reCaptchaResult = await Utils.checkReCaptcha(reCaptcha);
    if (!reCaptchaResult) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeReCaptchaFailed,
        type: Const.logTypeAdminPage,
        message: "PasswordResetController - send reset password email, reCaptcha failed",
      });
    }

    if (!username) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoUsername,
        type: Const.logTypeAdminPage,
        message: "PasswordResetController - send reset password email, no username",
      });
    }

    const user = await AdminPageUser.findOne({ username });
    if (!user) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeWrongUsername,
        type: Const.logTypeAdminPage,
        message: "PasswordResetController - send reset password email, wrong username",
      });
    }

    if (!user.emailVerification.verified) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeEmailNotVerified,
        type: Const.logTypeAdminPage,
        message: "PasswordResetController - send reset password email, email not verified",
      });
    }

    const { token, tokenGeneratedAt } = sendResetPasswordEmail({ email: user.email });

    user.passwordReset = {
      token,
      tokenGeneratedAt,
      completed: false,
    };

    await user.save();

    Base.successResponse(response, Const.responsecodeSucceed, { emailSend: true });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "PasswordResetController - send reset password email",
      type: Const.logTypeAdminPage,
      error,
    });
  }
});

/**
 * @api {post} /api/v2/admin-page/password-reset/complete Complete password reset
 * @apiVersion 2.0.10
 * @apiName Complete password reset
 * @apiGroup WebAPI Admin page
 * @apiDescription API for completing password reset process
 *
 * @apiParam {String} reCaptcha reCaptcha token to verify
 * @apiParam {String} passwordResetToken Password reset token
 * @apiParam {String} password New password
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1641823573321,
 *   "data": {
 *     "passwordChanged": true
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 443211 No password parameter
 * @apiError (Errors) 443217 Invalid password. Minimum 8 characters length, at least 1 number, 1 uppercase and 1 lowercase letter
 * @apiError (Errors) 443400 No reCaptcha parameter
 * @apiError (Errors) 443401 reCaptcha failed
 * @apiError (Errors) 443460 No passwordResetToken parameter
 * @apiError (Errors) 443461 Invalid passwordResetToken parameter
 * @apiError (Errors) 443462 passwordResetToken expired
 */

router.post("/complete", async (request, response) => {
  try {
    const { reCaptcha, passwordResetToken, password } = request.body;

    if (!reCaptcha) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoReCaptchaParameter,
        type: Const.logTypeAdminPage,
        message: "PasswordResetController - complete password reset, no reCaptcha parameter",
      });
    }

    const reCaptchaResult = await Utils.checkReCaptcha(reCaptcha);
    if (!reCaptchaResult) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeReCaptchaFailed,
        type: Const.logTypeAdminPage,
        message: "PasswordResetController - complete password reset, reCaptcha failed",
      });
    }

    if (!passwordResetToken) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoToken,
        type: Const.logTypeAdminPage,
        message: "PasswordResetController - complete password reset, no passwordResetToken",
      });
    }

    const user = await AdminPageUser.findOne({
      "passwordReset.token": passwordResetToken,
      "passwordReset.completed": false,
    });
    if (!user) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidToken,
        type: Const.logTypeAdminPage,
        message: "PasswordResetController - complete password reset, invalid passwordResetToken",
      });
    }

    if (
      user.passwordReset.tokenGeneratedAt + Const.adminPagePasswordResetTokenValidInterval <
      Date.now()
    ) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeTokenExpired,
        type: Const.logTypeAdminPage,
        message: "PasswordResetController - complete password reset, passwordResetToken expired",
      });
    }

    if (!password) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoPassword,
        type: Const.logTypeAdminPage,
        message: "PasswordResetController - complete password reset, no password",
      });
    }
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidPassword,
        type: Const.logTypeAdminPage,
        message: "PasswordResetController - complete password reset, invalid password",
      });
    }

    const hashedPassword = await bcrypt.hash(password, Config.saltRounds);

    user.password = hashedPassword;
    user.passwordReset.completed = true;

    await user.save();

    Base.successResponse(response, Const.responsecodeSucceed, { passwordChanged: true });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "PasswordResetController - complete password reset",
      type: Const.logTypeAdminPage,
      error,
    });
  }
});

module.exports = router;
