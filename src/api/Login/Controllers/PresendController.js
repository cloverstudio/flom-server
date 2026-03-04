"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const crypto = require("crypto");

/**
 * @api {get} /api/v2/presend Send random string
 * @apiVersion 2.0.7
 * @apiName  Presend
 * @apiGroup Login
 * @apiDescription  API which is called to send a random string.
 *
 * @apiParam {string} [email] Contact email.
 *
 * @apiSuccessExample Success Response
 * {
 *   "code": 1,
 *   "time": 1590000125608,
 *   "data": {
 *     "token": "aurhjDFJSJaoa9Sw"
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 */

router.get("/", async (request, response) => {
  try {
    const oneTimeToken = crypto.randomBytes(16).toString("hex");

    Base.successResponse(response, Const.responsecodeSucceed, { oneTimeToken });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "PresendController",
      error,
    });
  }
});

module.exports = router;
