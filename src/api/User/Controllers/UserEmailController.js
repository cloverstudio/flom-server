"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { User } = require("#models");

/**
 * @api {patch} /api/v2/user/update-email Update users email address flom_v1
 * @apiVersion 2.0.10
 * @apiName  Update users email address flom_v1
 * @apiGroup WebAPI User - Email
 * @apiDescription  API which is called to update user's email address.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiParam {string} emailAddress  User's email address
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1660731589933,
 *     "data": {
 *         "success": true/false
 *     }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443802  Email address already taken
 * @apiError (Errors) 4000007 Token invalid
 */

router.patch("/update-email", auth({ allowUser: true }), async (request, response) => {
  try {
    const { emailAddress } = request.body;
    const user = request.user;

    const alreadyExists = await User.findOne({ email: emailAddress }).lean();
    if (alreadyExists) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeEmailAlreadyExists,
        message: `UserEmailController, update email - email address already taken`,
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      user._id.toString(),
      { email: emailAddress },
      { new: true },
    );
    const success = updatedUser.email === emailAddress;

    Base.successResponse(response, Const.responsecodeSucceed, { success });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "UserEmailController, update email",
      error,
    });
  }
});

/**
 * @api {get} /api/v2/user/email-code Send email verification code flom_v1
 * @apiVersion 2.0.10
 * @apiName  Send email verification code flom_v1
 * @apiGroup WebAPI User - Email
 * @apiDescription  API which is called to send a verification code to user's email address.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1660731589933,
 *     "data": {}
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443802  Email address already taken
 * @apiError (Errors) 4000007 Token invalid
 */

router.get("/email-code", auth({ allowUser: true }), async (request, response) => {
  try {
    const user = request.user;

    const alreadyExists = await User.find({ email: user.email }).lean();
    if (alreadyExists.length > 1) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeEmailAlreadyExists,
        message: `UserEmailController, send code - user with same email address exists`,
      });
    }

    const code = createActivationCode(6);
    await User.updateOne(
      { _id: user._id.toString() },
      { "emailActivation.code": code, "emailActivation.timestamp": Date.now() },
    );

    Utils.sendEmailWithSG(
      "Verify your email address",
      "Hello.\nWe have received an email address verification request.\nYour temporary code is:\n\n" +
        code +
        "\n\nThe code is valid for 24 hours.\n\nFLOM\nhttps://flom.app",
      user.email,
    );

    Base.successResponse(response, Const.responsecodeSucceed);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "UserEmailController, send code",
      error,
    });
  }
});

/**
 * @api {get} /api/v2/user/verify-email Verify email address flom_v1
 * @apiVersion 2.0.10
 * @apiName  Verify email address flom_v1
 * @apiGroup WebAPI User - Email
 * @apiDescription  API which is called to send a confirmation code to user's email address.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiParam (Query string) {string} code  Verification code
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1660731589933,
 *     "data": {}
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443803  Code expired
 * @apiError (Errors) 443804  Invalid code
 * @apiError (Errors) 4000007 Token invalid
 */

router.get("/verify-email", auth({ allowUser: true }), async (request, response) => {
  try {
    const user = request.user;
    const code = request.query.code;

    if (user.emailActivation.timestamp < Date.now - 1000 * 60 * 60 * 24) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeActivationCodeExpired,
        message: `UserEmailController, verify email - code expired`,
      });
    }

    if (user.emailActivation.code !== code) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeActivationCodeInvalid,
        message: `UserEmailController, verify email - invalid code`,
      });
    }

    await User.updateOne({ _id: user._id.toString() }, { "emailActivation.isVerified": true });

    Base.successResponse(response, Const.responsecodeSucceed);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "UserEmailController, verify email",
      error,
    });
  }
});

function createActivationCode(length) {
  let activationCode = "";

  for (let i = 0; i < length; i++) {
    const num = Math.floor(Math.random() * 9) + 1;
    activationCode += num;
  }
  return activationCode;
}

module.exports = router;
