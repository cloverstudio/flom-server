"use strict";

const bcrypt = require("bcrypt");
const router = require("express").Router();
const Base = require("../../Base");
const { Config, Const } = require("#config");
const Utils = require("#utils");
const { AdminPageUser } = require("#models");
const { sendVerificationEmail } = require("../helpers/sendEmail");

/**
 * @api {post} /api/v2/admin-page/register Admin page registration
 * @apiVersion 2.0.9
 * @apiName Admin page registration
 * @apiGroup WebAPI Admin page
 * @apiDescription API used for registering users for the Admin page. New users need to verify their email address to finish registration.
 * New users have role 50. After verifying email users will get role 100.
 *
 * @apiParam {String} reCaptcha reCaptcha token to verify
 * @apiParam {String} username Users username
 * @apiParam {String} password Users password. Minimum 8 characters length, at least 1 number, 1 uppercase and 1 lowercase letter
 * @apiParam {String} email Users email address
 * @apiParam {String} firstName First name of the user
 * @apiParam {String} lastName Last name of the user
 * @apiParam {String} phoneNumber Users mobile phone number
 * @apiParam {String} [bvn] BVN
 * @apiParam {String} address Users address (home location)
 * @apiParam {String} [socialMedia] JSON stringified array of objects e.g. "[{"type":1,"username":"md"},{"type":2,"username":"instar"}]"
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
 *     "userId": "6103a50b2bf6fa0274d17848",
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 400180 No phoneNumber
 * @apiError (Errors) 400271 No username
 * @apiError (Errors) 443001 Username taken
 * @apiError (Errors) 443100 No firstName
 * @apiError (Errors) 443101 No lastName
 * @apiError (Errors) 443102 No address
 * @apiError (Errors) 443211 No password
 * @apiError (Errors) 443212 Username contains forbidden characters (No spaces and only these special characters are allowed - _ ~ )
 * @apiError (Errors) 443216 No email
 * @apiError (Errors) 443217 Invalid password. Minimum 8 characters length, at least 1 number, 1 uppercase and 1 lowercase letter
 * @apiError (Errors) 443400 No reCaptcha parameter
 * @apiError (Errors) 443401 reCaptcha failed
 */

router.post("/", async (request, response) => {
  try {
    const { fields = {} } = await Utils.formParse(request);
    const { reCaptcha, username, password, email, firstName, lastName, bvn, address } = fields;
    const phoneNumber = Utils.formatPhoneNumber({ phoneNumber: fields.phoneNumber });
    const socialMedia = fields.socialMedia ? JSON.parse(fields.socialMedia) : [];

    if (!reCaptcha) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoReCaptchaParameter,
        type: Const.logTypeAdminPage,
        message: "Admin Page - RegistrationController, no reCaptcha parameter",
      });
    }

    const reCaptchaResult = await Utils.checkReCaptcha(reCaptcha);
    if (!reCaptchaResult) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeReCaptchaFailed,
        type: Const.logTypeAdminPage,
        message: "Admin Page - RegistrationController, reCaptcha failed",
      });
    }

    if (!username) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoUsername,
        type: Const.logTypeAdminPage,
        message: "Admin Page - RegistrationController, no username",
      });
    }

    const regex = RegExp("([a-zA-Z0-9]|-|_|~)");
    const usernameCharacters = username.split("");
    for (let i = 0; i < usernameCharacters.length; i++) {
      if (!regex.test(usernameCharacters[i])) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeWrongUsername,
          type: Const.logTypeAdminPage,
          message: `Admin Page - RegistrationController, invalid characters`,
        });
      }
    }

    const user = await AdminPageUser.findOne({ username }).lean();
    if (user) {
      if (
        user.emailVerification.verified ||
        user.created + Config.usernameProtectionPeriod > Utils.now()
      ) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeProfileUsernameTaken,
          type: Const.logTypeAdminPage,
          message: `Admin Page - RegistrationController, username taken`,
        });
      }
    }

    if (!password) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoPassword,
        type: Const.logTypeAdminPage,
        message: "Admin Page - RegistrationController, no password",
      });
    }
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidPassword,
        type: Const.logTypeAdminPage,
        message: "Admin Page - RegistrationController, invalid password",
      });
    }
    if (!email) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoEmail,
        type: Const.logTypeAdminPage,
        message: "Admin Page - RegistrationController, no email",
      });
    }
    if (!firstName) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoFirstName,
        type: Const.logTypeAdminPage,
        message: "Admin Page - RegistrationController, no firstName",
      });
    }
    if (!lastName) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoLastName,
        type: Const.logTypeAdminPage,
        message: "Admin Page - RegistrationController, no lastName",
      });
    }
    if (!phoneNumber) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoPhoneNumber,
        type: Const.logTypeAdminPage,
        message: "Admin Page - RegistrationController, no phoneNumber",
      });
    }
    if (!address) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoAddress,
        type: Const.logTypeAdminPage,
        message: "Admin Page - RegistrationController, no address",
      });
    }

    if (user) {
      await AdminPageUser.deleteOne({ _id: user._id });
    }

    const hashedPassword = await bcrypt.hash(password, Config.saltRounds);

    const { emailCode, emailToken } = sendVerificationEmail({ email });

    const newUser = await AdminPageUser.create({
      username,
      password: hashedPassword,
      role: Const.Role.INITIAL,
      email,
      emailVerification: {
        code: emailCode,
        token: emailToken,
        emailOut: Date.now(),
      },
      firstName,
      lastName,
      phoneNumber,
      bvn,
      address,
      socialMedia,
    });

    Base.successResponse(response, Const.responsecodeSucceed, {
      userId: newUser._id.toString(),
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "AdminPage - RegistrationController",
      type: Const.logTypeAdminPage,
      error,
    });
  }
});

module.exports = router;
