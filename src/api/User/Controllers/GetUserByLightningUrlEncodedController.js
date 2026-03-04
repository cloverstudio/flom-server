"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { User } = require("#models");

/**
 * @api {get} /api/v2/user/get-by-lncode Get user by encoded Lightning Network URL flom_v1
 * @apiVersion 2.0.12
 * @apiName  Get user by encoded Lightning Network URL flom_v1
 * @apiGroup WebAPI User
 * @apiDescription  API which is called to find a user by the encoded Lightning Network URL.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiParam (Query string) {String}  encodedUrl  Encoded URL
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1660731589933,
 *     "data": {
 *         "user": { USER MODEL }
 *     }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443815  Missing encodedUrl parameter
 * @apiError (Errors) 443040  User not found
 * @apiError (Errors) 4000007 Token invalid
 */

router.get("/", auth({ allowUser: true }), async (request, response) => {
  try {
    const encodedUrl = request.query.encodedUrl;

    if (!encodedUrl) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoEncodedUrl,
        message: `GetUserByLightningUrlEncodedController, missing encodedUrl`,
      });
    }

    const resultUser = await User.findOne({
      lightningUrlEncoded: encodedUrl,
      "isDeleted.value": false,
    }).lean();

    if (!resultUser) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNotFound,
        message: `GetUserByLightningUrlEncodedController, user not found`,
      });
    }

    delete resultUser.token;
    delete resultUser.lightningRequestTags;

    Base.successResponse(response, Const.responsecodeSucceed, { user: resultUser });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "GetUserByLightningUrlEncodedController, verify email",
      error,
    });
  }
});

module.exports = router;
