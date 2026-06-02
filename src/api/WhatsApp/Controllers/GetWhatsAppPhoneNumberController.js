"use strict";

/**
 * @api {get} /api/v2/whatsapp/phone-number Get WhatsApp phone number
 * @apiVersion 2.0.34
 * @apiName Get WhatsApp phone number
 * @apiGroup WebAPI WhatsApp
 * @apiDescription Returns the WhatsApp phone number. If userPhoneNumber and businessPhoneNumber parameters are provided, it creates a link between the user's business number and his account phone number. If only userPhoneNumber is provided, it is presumed that the user's business number and account phone number are the same, and the link is created accordingly.
 *
 * @apiParam (Query string)  [userPhoneNumber]      User's phone number
 * @apiParam (Query string)  [businessPhoneNumber]  User's business phone number (if user's number and user's business number are the same, no need to send)
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
const Utils = require("#utils");
const { User } = require("#models");

router.get("/", async function (request, response) {
  try {
    let { userPhoneNumber, businessPhoneNumber } = request.query;

    if (userPhoneNumber) {
      userPhoneNumber = Utils.formatPhoneNumber(userPhoneNumber);
    }

    if (businessPhoneNumber) {
      businessPhoneNumber = Utils.formatPhoneNumber(businessPhoneNumber);
    }

    if (userPhoneNumber && !businessPhoneNumber) {
      businessPhoneNumber = userPhoneNumber;
    }

    if (businessPhoneNumber) {
      await User.updateOne(
        { phoneNumber: userPhoneNumber },
        { "whatsApp.businessPhoneNumber": businessPhoneNumber },
      );
    }

    return Base.successResponse(response, Const.responsecodeSucceed, {
      phoneNumber: Config.whatsAppPhoneNumber || "",
    });
  } catch (error) {
    return Base.newErrorResponse({ response, message: "GetWhatsAppPhoneNumber", error });
  }
});

module.exports = router;
