"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { User } = require("#models");
const { auth } = require("#middleware");

/**
 * @api {patch} /api/v2/shipping/options Update users shipping options flom_v1
 * @apiVersion 2.0.32
 * @apiName  Update shipping options flom_v1
 * @apiGroup WebAPI Shipping
 * @apiDescription  Update user's shipping options.
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiParam {Number}  [shippingInterval]  Number of days after order payment that the order should be shipped within. Must be an integer.
 *
 * @apiSuccessExample {json} Success Response
 * {
 *     "code": 1,
 *     "time": 1700058064142,
 *     "data": {}
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443801 Invalid parameter
 * @apiError (Errors) 4000007 Token invalid
 */

router.patch("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const options = user.shippingOptions || {};

    const { shippingInterval } = request.body;

    const updateObj = {};

    if (shippingInterval !== undefined && shippingInterval !== options.shippingInterval) {
      if (
        typeof shippingInterval !== "number" ||
        !Number.isInteger(shippingInterval) ||
        shippingInterval < 0
      ) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidParameter,
          message: "UpdateUsersShippingOptionsController, shippingInterval param is invalid",
          param: "shippingInterval",
        });
      }

      updateObj["shippingOptions.shippingInterval"] = shippingInterval;
    }

    await User.findByIdAndUpdate(user._id.toString(), updateObj);

    Base.successResponse(response, Const.responsecodeSucceed);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "UpdateUsersShippingOptionsController",
      error,
    });
  }
});

module.exports = router;
