"use strict";

const bcrypt = require("bcrypt");
const router = require("express").Router();
const Base = require("../../Base");
const { Config, Const } = require("#config");
const Utils = require("#utils");
const { AdminPageUser } = require("#models");

/**
 * @api {post} /api/v2/admin-page/login Admin page login
 * @apiVersion 2.0.10
 * @apiName Admin page login
 * @apiGroup WebAPI Admin page
 * @apiDescription This API is called in order to get a token for accessing admin page. If 2FA is required then SMS code will be sent to the
 * phone number used when registering. In the response you will get temp token which you need for checking if code is correct. SMS code is valid for
 * 2 minutes and the temp token is valid for 5 minutes
 *
 * @apiParam {String} captcha reCaptcha token to verify
 * @apiParam {String} username Users username
 * @apiParam {String} password Users password
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1590000125608,
 *   "data": {
 *     "id": "aaaaaaaaaaaaaaaaaaaaa",
 *     "accessToken": "3keQHokKOiPdo8S56OmU",
 *     "role": 900 // 900 - admin
 *   }
 * }
 *
 * @apiSuccessExample {json} 2FA Required Response
 * {
 *   "code": 443402,
 *   "time": 1590000125608,
 *   "data": {
 *     "tempToken": "3keQHokKOiPdo8S56O"
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 443210 No username
 * @apiError (Errors) 443211 No password
 * @apiError (Errors) 443212 Wrong username
 * @apiError (Errors) 443213 Wrong password
 * @apiError (Errors) 443389 Email not verified
 * @apiError (Errors) 443400 No reCaptcha parameter
 * @apiError (Errors) 443401 reCaptcha failed
 * @apiError (Errors) 443402 2FA authentication required
 * @apiError (Errors) 443403 Error when sending sms code
 */

router.post("/", async (request, response) => {
  try {
    const { reCaptcha, username, password } = request.body;

    if (!reCaptcha) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoReCaptchaParameter,
        type: Const.logTypeAdminPage,
        message: "Admin Page - LoginController, no reCaptcha parameter",
      });
    }

    const reCaptchaResult = await Utils.checkReCaptcha(reCaptcha);
    if (!reCaptchaResult) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeReCaptchaFailed,
        type: Const.logTypeAdminPage,
        message: "Admin Page - LoginController, reCaptcha failed",
      });
    }

    if (!username) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoUsername,
        type: Const.logTypeAdminPage,
        message: "Admin Page - LoginController, no username",
      });
    }
    if (!password) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoPassword,
        type: Const.logTypeAdminPage,
        message: "Admin Page - LoginController, no password",
      });
    }

    const user = await AdminPageUser.findOne({ username });
    if (!user) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeWrongUsername,
        type: Const.logTypeAdminPage,
        message: "Admin Page - LoginController, wrong username",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeWrongPassword,
        type: Const.logTypeAdminPage,
        message: "Admin Page - LoginController, wrong password",
      });
    }

    if (!user.emailVerification.verified) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeEmailNotVerified,
        type: Const.logTypeAdminPage,
        message: "Admin Page - LoginController, email not verified",
      });
    }

    if (user.role >= Const.Role.ADMIN) {
      user.twoFactorAuth = {};

      try {
        await sendTwoFactorAuthSMS({ user });
      } catch (error) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeErrorWhenSendingCode,
          type: Const.logTypeAdminPage,
          message: "Admin Page - LoginController, error when sending 2FA SMS code",
          error,
        });
      }

      user.twoFactorAuth.tempToken = Utils.getRandomString(Const.twoFactorAuthTokenLength);
      user.twoFactorAuth.tokenGeneratedAt = Date.now();

      await user.save();
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNeedTwoFactorAuth,
        data: {
          tempToken: user.twoFactorAuth.tempToken,
        },
        message: "Admin Page - LoginController, 2FA needed",
      });
    }

    const newToken = Utils.getRandomString(Const.adminPageTokenLength);
    const tokenObj = {
      token: newToken,
      generatedAt: Date.now(),
    };

    user.token = tokenObj;
    await user.save();

    Base.successResponse(response, Const.responsecodeSucceed, {
      id: user._id.toString(),
      accessToken: newToken,
      role: user.role,
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "AdminPage - LoginController",
      type: Const.logTypeAdminPage,
      error,
    });
  }
});

/**
 * @api {post} /api/v2/admin-page/login/2fa/resend Admin page resend 2FA SMS
 * @apiVersion 2.0.10
 * @apiName Admin page resend 2FA SMS
 * @apiGroup WebAPI Admin page
 * @apiDescription API for resending 2FA SMS. User can request max 3 times to resend code
 *
 * @apiParam {String} tempToken Temp token used for 2FA
 * @apiParam {String} username Users username
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1590000125608,
 *   "data": {
 *     "smsSent": true
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 443210 No username
 * @apiError (Errors) 443212 Wrong username
 * @apiError (Errors) 443403 Error when sending sms code
 * @apiError (Errors) 443404 No tempToken
 * @apiError (Errors) 443435 Invalid or expired temp token
 * @apiError (Errors) 443436 Too many SMS retries (Max 3 times)
 */

router.post("/2fa/resend", async (request, response) => {
  try {
    const { tempToken, username } = request.body;

    if (!username) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoUsername,
        type: Const.logTypeAdminPage,
        message: "Admin Page - LoginController 2FA resend, no username",
      });
    }

    const user = await AdminPageUser.findOne({ username });
    if (!user) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeWrongUsername,
        type: Const.logTypeAdminPage,
        message: "Admin Page - LoginController 2FA resend, wrong username",
      });
    }

    if (!tempToken) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoTempToken,
        type: Const.logTypeAdminPage,
        message: "Admin Page - LoginController 2FA resend, no tempToken",
      });
    }
    if (
      tempToken !== user.twoFactorAuth.tempToken ||
      Date.now() > user.twoFactorAuth.tokenGeneratedAt + Const.adminTempTokenValidInterval
    ) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidOrExpiredTempToken,
        type: Const.logTypeAdminPage,
        message: "Admin Page - LoginController 2FA resend, invalid or expired temp token",
      });
    }

    if (user.twoFactorAuth.smsTry >= 3) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeTooManySMSRetries,
        type: Const.logTypeAdminPage,
        message: "Admin Page - LoginController 2FA resend, too many sms retries",
      });
    }

    try {
      await sendTwoFactorAuthSMS({ user });
    } catch (error) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeErrorWhenSendingCode,
        type: Const.logTypeAdminPage,
        message: "Admin Page - LoginController 2FA resend, error when sending 2FA SMS code",
        error,
      });
    }

    Base.successResponse(response, Const.responsecodeSucceed, { smsSent: true });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "AdminPage - LoginController 2FA resend",
      type: Const.logTypeAdminPage,
      error,
    });
  }
});

/**
 * @api {post} /api/v2/admin-page/login/2fa Admin page 2FA login
 * @apiVersion 2.0.10
 * @apiName Admin page 2fa login
 * @apiGroup WebAPI Admin page
 * @apiDescription This API is called if admin page login API returned 2FA needed error. API checks users tempToken and code from SMS
 *
 * @apiParam {String} tempToken Temp token used for 2FA
 * @apiParam {String} username Users username
 * @apiParam {String} code Users password
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1590000125608,
 *   "data": {
 *     "id": "aaaaaaaaaaaaaaaaaaaaa",
 *     "accessToken": "3keQHokKOiPdo8S56OmU",
 *     "role": 900 // 900 - admin
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 443210 No username
 * @apiError (Errors) 443212 Wrong username
 * @apiError (Errors) 443219 No code
 * @apiError (Errors) 443387 Invalid or expired code
 * @apiError (Errors) 443404 No tempToken
 * @apiError (Errors) 443435 Invalid or expired temp token
 */

router.post("/2fa", async (request, response) => {
  try {
    const { tempToken, username, code } = request.body;

    if (!username) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoUsername,
        type: Const.logTypeAdminPage,
        message: "Admin Page - LoginController 2FA, no username",
      });
    }

    const user = await AdminPageUser.findOne({ username });
    if (!user) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeWrongUsername,
        type: Const.logTypeAdminPage,
        message: "Admin Page - LoginController 2FA, wrong username",
      });
    }

    if (!tempToken) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoTempToken,
        type: Const.logTypeAdminPage,
        message: "Admin Page - LoginController 2FA, no tempToken",
      });
    }
    if (
      tempToken !== user.twoFactorAuth.tempToken ||
      Date.now() > user.twoFactorAuth.tokenGeneratedAt + Const.adminTempTokenValidInterval
    ) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidOrExpiredTempToken,
        type: Const.logTypeAdminPage,
        message: "Admin Page - LoginController 2FA, invalid or expired temp token",
      });
    }

    if (!code) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoCode,
        type: Const.logTypeAdminPage,
        message: "Admin Page - LoginController 2FA, no code",
      });
    }
    if (
      code !== user.twoFactorAuth.smsCode ||
      Date.now() - 1000 > user.twoFactorAuth.smsOut + Const.adminSmsCodeValidInterval
    ) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidCode,
        type: Const.logTypeAdminPage,
        message: "Admin Page - LoginController 2FA, invalid or expired code",
      });
    }

    const newToken = Utils.getRandomString(Const.adminPageTokenLength);
    const tokenObj = {
      token: newToken,
      generatedAt: Date.now(),
    };

    user.token = tokenObj;
    await user.save();

    Base.successResponse(response, Const.responsecodeSucceed, {
      id: user._id.toString(),
      accessToken: newToken,
      role: user.role,
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "AdminPage - LoginController 2FA",
      type: Const.logTypeAdminPage,
      error,
    });
  }
});

async function sendTwoFactorAuthSMS({ user }) {
  const { phoneNumber } = user;

  let smsCode;
  if (Config.environment !== "production") {
    smsCode = "555555";
  } else {
    smsCode = Utils.generateRandomNumber(6).toString();
  }

  user.twoFactorAuth["smsCode"] = smsCode;
  user.twoFactorAuth["smsOut"] = Date.now();
  user.twoFactorAuth["smsTry"] = user?.twoFactorAuth?.smsTry + 1 || 1;
  await user.save();

  if (Config.environment === "production") {
    await Utils.sendSmsNew({
      to: phoneNumber,
      from: Config.twilio.fromNumbers[user.twoFactorAuth.smsTry - 1],
      body: `Your Admin page 2FA code is ${smsCode}`,
    });
  }
}

module.exports = router;
