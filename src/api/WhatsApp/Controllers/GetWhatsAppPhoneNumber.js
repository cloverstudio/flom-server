"use strict";

/**
 * @api {get} /api/v2/whatsapp/phone-number Get WhatsApp phone number
 * @apiVersion 2.0.34
 * @apiName Get WhatsApp phone number
 * @apiGroup WebAPI WhatsApp
 * @apiDescription Returns the WhatsApp phone number.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1776689659273,
 *     "data": {
 *         "phoneNumber": String
 *     }
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

const router = require("express").Router();
const Base = require("../../Base");
const { Const, Config } = require("#config");
const { auth } = require("#middleware");

router.get("/", auth({ allowUser: true }), async function (request, response) {
  try {
    return Base.successResponse(response, Const.responsecodeSucceed, {
      phoneNumber: Config.whatsAppPhoneNumber || "",
    });
  } catch (error) {
    return Base.newErrorResponse({ response, message: "GetWhatsAppPhoneNumber", error });
  }
});

module.exports = router;
