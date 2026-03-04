"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");

/**
 * @api {post} /api/v2/credit-cards/country Get credit card country code
 * @apiVersion 2.0.6
 * @apiName Get credit card country code
 * @apiGroup WebAPI Credit Card
 * @apiDescription API for getting credit card country code. Country code defaults to US.
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiParam  {String} binNumber First 9 digits of credit card number
 *
 * @apiSuccessExample Success Response
 * {
 *   "code": 1,
 *   "time": 1590000125608,
 *   "version": {
 *     "update": 1, // 0 - no update, 1 - optional update
 *     "popupHiddenLength": 24 // in hours
 *   },
 *   "data": {
 *     "countryCode": "US"
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 443124 No binNumber parameter
 * @apiError (Errors) 443125 binNumber length is not correct
 * @apiError (Errors) 4000007 Token invalid
 */

router.post("/country", auth({ allowUser: true }), async (request, response) => {
  try {
    let { binNumber } = request.body;

    if (!binNumber) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoCardNumber,
        type: Const.logTypeCreditCard,
        message: `Credit card, no binNumber`,
      });
    }
    if (binNumber.length < 9) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeBuyCardNumberLength,
        type: Const.logTypeCreditCard,
        message: `Credit card, wrong binNumber length`,
      });
    }
    if (binNumber.length > 9) binNumber = binNumber.slice(0, 9);

    const countryCode = (await Utils.countryFromBinNumber(binNumber)) || "US";

    Base.successResponse(response, Const.responsecodeSucceed, { countryCode });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "CreditCardController, get credit card country code",
      error,
    });
  }
});

module.exports = router;
