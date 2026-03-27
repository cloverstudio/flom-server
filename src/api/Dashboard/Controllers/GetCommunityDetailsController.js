"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { Membership, RecurringPayment, User } = require("#models");

/**
 * @api {get} /api/v2/dashboard/community Dashboard - community details API
 * @apiVersion 0.0.1
 * @apiName Dashboard - community details API
 * @apiGroup WebAPI Dashboard
 * @apiDescription API that can be used to fetch community details on dashboard.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiSuccessExample {json} Success Response
 * {
 *     "code": 1,
 *     "time": 1658485620445,
 *     "data": {
 *         "memberships": [
 *             {
 *                 "recurringPaymentType": 1,
 *                 "benefits": [
 *                     {
 *                         "type": 1,
 *                         "title": "Group chat",
 *                         "enabled": false
 *                     },
 *                     {
 *                         "type": 2,
 *                         "title": "Private messaging",
 *                         "enabled": true
 *                     },
 *                     {
 *                         "type": 3,
 *                         "title": "Video call",
 *                         "enabled": false
 *                     },
 *                     {
 *                         "type": 4,
 *                         "title": "Audio call",
 *                         "enabled": false
 *                     },
 *                     {
 *                         "type": 5,
 *                         "title": "Content description",
 *                         "enabled": false
 *                     },
 *                     {
 *                         "type": 6,
 *                         "title": "Go live",
 *                         "enabled": false
 *                     }
 *                 ],
 *                 "created": 1645554840022,
 *                 "deleted": false,
 *                 "_id": "62152c98d1a8ac16c7eb14f6",
 *                 "name": "Vrhunski plan",
 *                 "amount": 5,
 *                 "description": "Eto ga.",
 *                 "order": 1,
 *                 "creatorId": "5f87132ffa90652b60469b96",
 *                 "__v": 0
 *             },
 *         ],
 *         "total": [
 *             {
 *                 "_id": "62152c98d1a8ac16c7eb14f6",
 *                 "sumAmount": 15,
 *                 "localSumAmount": 1500
 *             },
 *             {
 *                 "_id": "621e64a0d6db386b68a8d5ae",
 *                 "sumAmount": 3165,
 *                 "localSumAmount": 1500000
 *             }
 *         ]
 *     }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 4000007 Token not valid
 */

router.get("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const token = request.headers["access-token"];

    const user = await User.find({ "token.token": token }).lean();

    if (!user) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeSigninInvalidToken,
        message: "GetCommunityDetailsController, invalid user token",
      });
    }

    const ownMemberships = await Membership.find({ creatorId: user[0]._id.toString() }).lean();

    const ownMembershipsIds = ownMemberships.map((membership) => membership.id);

    const transfers = await RecurringPayment.aggregate([
      { $unwind: { path: "$transfers" } },
      {
        $match: {
          "membership.currentId": { $in: ownMembershipsIds },
        },
      },
      {
        $group: {
          _id: "$membership.currentId",
          sumAmount: { $sum: "$transfers.amount" },
          localSumAmount: { $sum: "$transfers.localAmountReceiver.value" },
        },
      },
    ]);

    Base.successResponse(response, Const.responsecodeSucceed, {
      memberships: ownMemberships,
      total: transfers,
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "GetCommunityDetailsController",
      error,
    });
  }
});

module.exports = router;
