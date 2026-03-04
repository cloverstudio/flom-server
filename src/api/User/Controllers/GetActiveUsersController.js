"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, Config } = require("#config");
const { User } = require("#models");

/**
 * @api {get} /api/v2/users/active/total Get active users total flom_v1
 * @apiVersion 2.0.25
 * @apiName Get active users total
 * @apiGroup WebAPI User
 * @apiDescription This API should be used to fetch the total count of active users.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiSuccessExample {json} Success Response
 * {
 *     "code": 1,
 *     "time": 1696939461167,
 *     "data": {
 *         "activeUsersTotal": 22
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

router.get("/total", async function (request, response) {
  try {
    const token = request.headers["access-token"];

    if (token !== Config.guestToken) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeSigninInvalidToken,
        message: "GetActiveUsersTotalController, invalid token",
      });
    }

    const activeUsersTotal = await User.countDocuments({
      hasLoggedIn: Const.userLoggedInAtLeastOnce,
      "isDeleted.value": false,
    });

    Base.successResponse(response, Const.responsecodeSucceed, { activeUsersTotal });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "GetActiveUsersTotalController",
      error,
    });
  }
});

/**
 * @api {get} /api/v2/users/active Get active users flom_v1
 * @apiVersion 2.0.14
 * @apiName Get active users
 * @apiGroup WebAPI User
 * @apiDescription This API should be used to fetch the list of active users.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam (Query string) {String} [page] Page
 *
 * @apiSuccessExample {json} Success Response
 * {
 *     "code": 1,
 *     "time": 1696939461167,
 *     "data": {
 *         "hasNext": false,
 *         "activeUsers": [
 *             {
 *                 "_id": "63dcc7f3bcc5921af87df5c2",
 *                 "username": "marko_04",
 *                 "lastModified": 1675413491799,
 *                 "created": 1675413491799
 *             },
 *             {
 *                 "_id": "63dcc8b9bcc5921af87df5c8",
 *                 "username": "The_Real_Q",
 *                 "lastModified": 1675413689104,
 *                 "created": 1675413689104
 *             },
 *             {
 *                 "_id": "63dccc42bcc5921af87df5ce",
 *                 "username": "Major_Kira_Nerys",
 *                 "lastModified": 1675414594155,
 *                 "created": 1675414594155
 *             },
 *             {
 *                 "_id": "63dce956c30542684f1b7b63",
 *                 "username": "ivoperic",
 *                 "lastModified": 1675422038225,
 *                 "created": 1675422038225
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

router.get("/", async function (request, response) {
  try {
    const token = request.headers["access-token"];

    if (token !== Config.guestToken) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeSigninInvalidToken,
        message: "GetActiveUsersController, invalid token",
      });
    }

    const limit = 50_000;
    const page = request.query.page ? +request.query.page : 1;
    const skip = page > 0 ? (page - 1) * limit : 0;

    const users = await User.find(
      {
        hasLoggedIn: Const.userLoggedInAtLeastOnce,
        "isDeleted.value": false,
      },
      {
        userName: 1,
        modified: 1,
        created: 1,
      },
    )
      .limit(limit)
      .skip(skip)
      .lean();

    const activeUsers = users.map((user) => {
      return {
        _id: user._id.toString(),
        username: user.userName,
        lastModified: user.modified ?? user.created,
        created: user.created,
      };
    });

    const countResult = await User.countDocuments({
      hasLoggedIn: Const.userLoggedInAtLeastOnce,
      "isDeleted.value": false,
    });
    const hasNext = countResult > skip + limit;

    Base.successResponse(response, Const.responsecodeSucceed, { activeUsers, hasNext });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "GetActiveUsersController",
      error,
    });
  }
});

module.exports = router;
