"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");

/**
 * @api {get} /api/v2/memberships/benefits Get membership benefits
 * @apiVersion 2.0.8
 * @apiName Get membership benefits
 * @apiGroup WebAPI Membership
 * @apiDescription Returns benefits for memberships
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiSuccessExample Success-Response:
 * {
 *   "code": 1,
 *   "time": 1631704559230,
 *   "data": {
 *     "benefits": [
 *       {
 *         "type": 1,
 *         "title": "Group chat",
 *         "enabled": false
 *       },
 *       {
 *         "type": 2,
 *         "title": "Private messaging",
 *         "enabled": false
 *       },
 *       {
 *         "type": 3,
 *         "title": "Video call",
 *         "enabled": false
 *       },
 *       {
 *         "type": 4,
 *         "title": "Audio call",
 *         "enabled": false
 *       }
 *     ]
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
    const benefits = Object.values(Const.membershipBenefits);

    Base.successResponse(response, Const.responsecodeSucceed, { benefits });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "GetMembershipBenefitsController",
      error,
    });
  }
});

module.exports = router;
