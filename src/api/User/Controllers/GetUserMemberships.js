"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const Utils = require("#utils");
const { User, Membership } = require("#models");

/**
 * @api {get} /api/v2/users/memberships Get users memberships
 * @apiVersion 2.0.8
 * @apiName Get users memberships
 * @apiGroup WebAPI User
 * @apiDescription API for getting list of memberships you are member of
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiSuccessExample Success-Response:
 * {
 *   "code": 1,
 *   "time": 1631799685420,
 *   "data": {
 *     "memberships": [
 *       {
 *         "_id": "6141df713a89d6a65fdccb55",
 *         "benefits": [
 *           {
 *             "type": 1,
 *             "title": "Group chat",
 *             "enabled": true
 *           },
 *           {
 *             "type": 2,
 *             "title": "Private messaging",
 *             "enabled": true
 *           },
 *           {
 *             "type": 3,
 *             "title": "Video call",
 *             "enabled": true
 *           },
 *           {
 *             "type": 4,
 *             "title": "Audio call",
 *             "enabled": true
 *           }
 *         ],
 *         "created": 1631706993771,
 *         "name": "Plan 5",
 *         "amount": 12.99,
 *         "description": "This is the greatest plan. Get it now!",
 *         "order": 3,
 *         "creatorId": "5f7ee464a283bc433d9d722f",
 *         "creator": {
 *           "_id": "5f7ee464a283bc433d9d722f",
 *           "name": "+2348*****0007",
 *           "phoneNumber": "+2348020000007",
 *           "bankAccounts": [],
 *           "avatar": {
 *             "picture": {
 *               "originalName": "cropped2444207444774310745.jpg",
 *               "size": 4698848,
 *               "mimeType": "image/png",
 *               "nameOnServer": "profile-3XFUoWqVRofEPbMfC1ZKIDNj"
 *             },
 *             "thumbnail": {
 *               "originalName": "cropped2444207444774310745.jpg",
 *               "size": 97900,
 *               "mimeType": "image/png",
 *               "nameOnServer": "thumb-wDIl52eluinZOQ20yNn2PpnMwi"
 *             }
 *           }
 *         },
 *         "expirationDate": 1646085600000,
 *         "startDate": -1
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
    const user = await User.findById(request.user._id.toString());
    const userMemberships = Utils.filterExpiredMemberships(user.memberships);
    if (userMemberships.length !== user.memberships.length) {
      user.memberships = userMemberships;
      user.markModified("memberships");
      await user.save();
    }

    if (userMemberships.length === 0) {
      return Base.successResponse(response, Const.responsecodeSucceed, {
        memberships: [],
      });
    }

    const userMembershipIds = [];
    const dates = {};
    userMemberships.forEach((membership) => {
      userMembershipIds.push(membership.id);
      dates[membership.id] = {
        expirationDate: membership.expirationDate,
        startDate: membership.startDate,
      };
    });

    const memberships = await Membership.find({ _id: { $in: userMembershipIds } }).lean();

    const creatorIds = new Set();
    memberships.forEach((membership) => {
      delete membership.__v;
      creatorIds.add(membership.creatorId);
    });

    const creators = await User.find(
      { _id: { $in: [...creatorIds] } },
      { _id: 1, name: 1, username: 1, phoneNumber: 1, bankAccounts: 1, avatar: 1 },
    ).lean();

    const creatorsObj = creators.reduce((result, creator) => {
      result[creator._id.toString()] = creator;
      return result;
    }, {});

    memberships.forEach((membership) => {
      const date = dates[membership._id.toString()];
      membership.creator = creatorsObj[membership.creatorId];
      membership.expirationDate = date.expirationDate;
      membership.startDate = date.startDate;
    });

    Base.successResponse(response, Const.responsecodeSucceed, {
      memberships,
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "JoinMembershipController",
      error,
    });
  }
});

module.exports = router;
