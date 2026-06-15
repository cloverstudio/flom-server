"use strict";

/**
 * @api {get} /api/v2/whatsapp/phone-number Get WhatsApp phone number flom_v1
 * @apiVersion 2.0.34
 * @apiName Get WhatsApp phone number flom_v1
 * @apiGroup WebAPI WhatsApp
 * @apiDescription Returns the WhatsApp phone number. If businessPhoneNumber parameter is provided, it creates a link between the user's business number and his account phone number. To link the WhatsApp business, a number must be provided even if it is the same as the user's phone number.
 *
 * @apiHeader {String} [access-token] Users unique access-token. Only needed if businessPhoneNumber query parameter is provided.
 *
 * @apiParam (Query string)  [businessPhoneNumber]  User's business phone number
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
 * @apiError (Errors) 443040 User not found
 * @apiError (Errors) 443957 Given business number is already a user's phone number
 * @apiError (Errors) 443958 Given business number is already registered as a business number
 * @apiError (Errors) 443040 User not found
 * @apiError (Errors) 4000007 Token not valid
 */

const router = require("express").Router();
const Base = require("../../Base");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { User } = require("#models");

router.get("/", async function (request, response) {
  try {
    let { businessPhoneNumber } = request.query;

    if (businessPhoneNumber) {
      console.log("GetWhatsAppPhoneNumber, businessPhoneNumber:", businessPhoneNumber);

      if (!businessPhoneNumber.startsWith("+")) {
        businessPhoneNumber = "+" + businessPhoneNumber;
      }
      businessPhoneNumber =
        Config.environment !== "production"
          ? businessPhoneNumber
          : Utils.formatPhoneNumber({ phoneNumber: businessPhoneNumber });

      const businessUser = await User.findOne({
        "whatsApp.businessPhoneNumber": businessPhoneNumber,
        "whatsApp.businessConnected": true,
        "isDeleted.value": false,
      });
      if (businessUser) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeBusinessNumberAlreadyExists,
          message: `GetWhatsAppPhoneNumber, ${businessPhoneNumber} is existing business phone number, cannot register as business number`,
        });
      }

      const existingUser = await User.findOne({ phoneNumber: businessPhoneNumber }).lean();
      if (existingUser) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeBusinessNumberIsUserNumber,
          message: `GetWhatsAppPhoneNumber, ${businessPhoneNumber} is existing user's phone number, cannot register as business number`,
        });
      }

      const token = request.headers["access-token"];

      if (!token) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeSigninInvalidToken,
          message: "GetWhatsAppPhoneNumber, invalid token",
        });
      }

      const user = await User.findOne({ "token.token": token }).lean();

      if (!user) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeUserNotFound,
          message: "GetWhatsAppPhoneNumber, user not found",
        });
      }

      await User.findByIdAndUpdate(user._id, {
        "whatsApp.businessPhoneNumber": businessPhoneNumber,
      });
    }

    return Base.successResponse(response, Const.responsecodeSucceed, {
      phoneNumber: Config.whatsAppPhoneNumber || "",
    });
  } catch (error) {
    return Base.newErrorResponse({ response, message: "GetWhatsAppPhoneNumber", error });
  }
});

module.exports = router;
