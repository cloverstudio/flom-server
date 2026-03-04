"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { User } = require("#models");

/**
 * @api {get} /api/v2/tribes/find Get users by username
 * @apiVersion 2.0.10
 * @apiName Get users by username
 * @apiGroup WebAPI Tribe
 * @apiDescription This API is called for searching users
 *
 * @apiHeader {String} access-token Users unique access-token
 *
 * @apiParam (Query string) username Search users by username
 * @apiParam (Query string) [page] Page number
 * @apiParam (Query string) [itemsPerPage] Items per page number
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1643163567261,
 *   "data": {
 *   "users": [{
 *     "_id": "5f11806613c3a91fe32e74c6",
 *     "created": 1594982502401,
 *     "phoneNumber": "+38698989898",
 *     "userName": "asfkml03",
 *     "avatar": {
 *       "picture": {
 *         "originalName": "cropped834230393409265906.jpg",
 *         "size": 2771306,
 *         "mimeType": "image/png",
 *         "nameOnServer": "profile-pUsxE83rh1FATDvvyAheKQ81"
 *       },
 *       "thumbnail": {
 *         "originalName": "cropped834230393409265906.jpg",
 *         "size": 60200,
 *         "mimeType": "image/png",
 *         "nameOnServer": "thumb-i2T4337nUnonks2s5xYMUVrfuX"
 *       }
 *     }
 *   }],
 *   "pagination": {
 *     "itemsPerPage": 10,
 *     "page": 1,
 *     "total": 1
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 400007 Token not valid
 * @apiError (Errors) 443483 Search query missing
 */

router.get("/find", auth({ allowUser: true }), async (request, response) => {
  try {
    const searchTerm = request.query.username || "";
    const page = +request.query.page || 1;
    const itemsPerPage = +request.query.itemsPerPage || Const.newPagingRows;

    if (!searchTerm.trim()) {
      return Base.newErrorResponse({
        response,
        message: `GetUserByUsernameController, query search username cannot be empty`,
        code: Const.responsecodeTribeEmptySearchQuery,
      });
    }

    const userQuery = {
      _id: { $ne: request.user._id },
      userName: new RegExp(searchTerm, "i"),
    };

    const userCount = await User.countDocuments(userQuery);
    const users = await User.find(userQuery, {
      userName: 1,
      avatar: 1,
      phoneNumber: 1,
      bankAccounts: 1,
      created: 1,
    })
      .limit(itemsPerPage)
      .skip((page - 1) * itemsPerPage)
      .lean();

    Base.successResponse(response, Const.responsecodeSucceed, {
      users,
      pagination: { itemsPerPage, page, total: userCount },
    });
  } catch (error) {
    Base.newErrorResponse({ response, message: "GetUserByUsernameController", error });
  }
});

module.exports = router;
