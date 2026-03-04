"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");

/**
 * @api {get} /api/v2/user/token-from-cookie Get token from cookie
 * @apiVersion 0.0.1
 * @apiName Get token from cookie
 * @apiGroup WebAPI User
 * @apiDescription API for gettin token from cookie.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiSuccessExample Success-Response:
 * {
 *   "code": 1,
 *   "time": 1540989079012,
 *   "data": {
 *       "accessToken": "ZTwJG12ejWnPQOJ2"
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 4000007 Token not valid
 */

router.get("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const accessToken = request.cookies["access-token"];

    return Base.successResponse(response, Const.responsecodeSucceed, { accessToken });
  } catch (e) {
    return Base.newErrorResponse({
      response,
      message: "GetTokenFromCookieController",
      error: e,
    });
  }
});

module.exports = router;
