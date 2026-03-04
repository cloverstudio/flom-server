"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { User } = require("#models");

/**
 * @api {post} /api/v2/user/rating-attempt Record rating attempt for user flom_v1
 * @apiVersion 2.0.28
 * @apiName  Record rating attempt for user flom_v1
 * @apiGroup WebAPI User
 * @apiDescription  Record rating attempt for user flom_v1
 *
 * @apiHeader {String} access-token Users unique access token
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1624535998267,
 *   "data": {}
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 4000007 Token invalid
 */

router.post("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;

    await User.findByIdAndUpdate(user._id, { ratingAttempted: true });

    const responseData = {};
    Base.successResponse(response, Const.responsecodeSucceed, responseData);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "RecordRatingAttemptController",
      error,
    });
  }
});

module.exports = router;
