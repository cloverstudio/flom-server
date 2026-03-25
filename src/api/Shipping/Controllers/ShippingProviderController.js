"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");

/**
 * @api {get} /api/v2/shipping/providers Get shipping providers flom_v1
 * @apiVersion 2.0.32
 * @apiName  Get shipping providers flom_v1
 * @apiGroup WebAPI Shipping
 * @apiDescription  Get available shipping providers.
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiSuccessExample {json} Success Response
 * {
 *     "code": 1,
 *     "time": 1700058064142,
 *     "data": {
 *       "shippingProviders": [
 *         {
 *           "type": "dhl",
 *           "displayName": "DHL"
 *         }
 *       ]
 *     }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 4000007 Token invalid
 */

router.get("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const shippingProviders = Const.shippingProviders;

    Base.successResponse(response, Const.responsecodeSucceed, { shippingProviders });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "ShippingProviderController",
      error,
    });
  }
});

module.exports = router;
