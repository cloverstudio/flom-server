"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { User } = require("#models");

/**
 * @api {get} /api/v2/dashboard/community/users Dashboard - Get users in your own communities API
 * @apiVersion 0.0.1
 * @apiName Dashboard - Get users in your own communities API
 * @apiGroup WebAPI Dashboard
 * @apiDescription API that can be used to fetch the list of users in your own communities.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam (Query string) {Number} membershipIds Array of membershipIds. For example  ( ?membershipIds[]=621cdfdad6db386b68a8d548&membershipIds[]=625e9afaca33ed174fcd5170 )
 * @apiParam (Query string) {String} [page] Page number for paging (default 1)
 *
 * @apiSuccessExample {json} Success Response
 * {
 *     "code": 1,
 *     "time": 1658476453887,
 *     "data": {
 *         "usersInMembership": [
 *             {
 *                 "_id": "5f87132ffa90652b60469b96",
 *                 "isAppUser": true,
 *                 "name": "James_Riddle",
 *                 "created": 1602687791835,
 *                 "phoneNumber": "+2348020000010",
 *                 "avatar": {
 *                     "picture": {
 *                         "originalName": "image_1638974601.jpg",
 *                         "size": 131446,
 *                         "mimeType": "image/png",
 *                         "nameOnServer": "jNklNbbXnRgwDgef5zNartoS6pZSMPY8"
 *                     },
 *                     "thumbnail": {
 *                         "originalName": "image_1638974601.jpg",
 *                         "size": 79800,
 *                         "mimeType": "image/png",
 *                         "nameOnServer": "KPZP4fE8PmqG4YPmJPoHfv9CN6BCiqSf"
 *                     }
 *                 },
 *                 "email": "luka.d@clover.studio",
 *                 "memberships": [
 *                     {
 *                         "id": "621cdfdad6db386b68a8d548"
 *                     },
 *                     {
 *                         "id": "625e99bbca33ed174fcd5155"
 *                     },
 *                     {
 *                         "id": "61519bfead73222878bfaf83"
 *                     },
 *                     {
 *                         "id": "6141cdb09c2112769234376d"
 *                     },
 *                     {
 *                         "id": "615642fb9754221d0a8e0e08"
 *                     }
 *                 ],
 *                 "cover": {
 *                     "banner": {
 *                         "file": {
 *                             "originalName": "imageB_1643200918.jpg",
 *                             "nameOnServer": "2eEvZ2Dx17Ejk1CvzkLdPFlfGEAERo47",
 *                             "size": 701318,
 *                             "mimeType": "image/png",
 *                             "aspectRatio": 3.20475
 *                         },
 *                         "fileType": 0,
 *                         "thumb": {
 *                             "originalName": "imageB_1643200918.jpg",
 *                             "nameOnServer": "fwwYWZxUU1bWHKMC33WhiFYKN9UNpEe7",
 *                             "mimeType": "image/jpeg",
 *                             "size": 299000
 *                         }
 *                     },
 *                     "audio": {
 *                         "file": {
 *                             "originalName": "311109AB-9620-46B7-BDC0-8BAECD134AF0.aac",
 *                             "nameOnServer": "4Uo2bjmtYx1062KWvZhwWDGTLMX9cwMG.mp3",
 *                             "mimeType": "audio/mpeg",
 *                             "duration": 4.623673,
 *                             "size": 74231,
 *                             "hslName": "ajXgxMJAUvRbRRPu530N0Ii58PUJdFHJ"
 *                         },
 *                         "fileType": 2
 *                     }
 *                 }
 *             },
 *         ],
 *         "total": 4,
 *         "countResult": 4,
 *         "hasNext": false
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
    var membershipIds = request.query.membershipIds || [];
    const page = +request.query.page || 1;

    const user = await User.find({ "token.token": token }).lean();

    if (!user) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeSigninInvalidToken,
        message: "GetCommunityPlanUsersController, invalid user token",
      });
    }

    const usersInMembership = await User.find(
      {
        memberships: {
          $elemMatch: { id: { $in: membershipIds }, creatorId: user[0]._id.toString() },
        },
      },
      {
        _id: 1,
        isAppUser: 1,
        name: 1,
        created: 1,
        phoneNumber: 1,
        bankAccounts: 1,
        avatar: 1,
        email: 1,
        cover: 1,
        "memberships.id": 1,
      },
    )
      .skip((page - 1) * Const.newPagingRows)
      .limit(Const.newPagingRows)
      .lean();

    const total = await User.find({
      memberships: {
        $elemMatch: { id: { $in: membershipIds }, creatorId: user[0]._id.toString() },
      },
    }).countDocuments();
    const hasNext = page * Const.newPagingRows < total;

    Base.successResponse(response, Const.responsecodeSucceed, {
      usersInMembership,
      total,
      countResult: usersInMembership.length,
      hasNext,
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "GetCommunityPlanUsersController",
      error,
    });
  }
});

module.exports = router;
