"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { Tribe } = require("#models");
const { formatTribes } = require("../helpers");

/**
 * @api {get} /api/v2/tribes Get tribes list
 * @apiVersion 2.0.10
 * @apiName Get tribes list
 * @apiGroup WebAPI Tribe
 * @apiDescription This API is called for fetching and querying tribes
 *
 * @apiHeader {String} access-token Users unique access-token
 *
 * @apiParam (Query string) [name] Name of the tribe
 * @apiParam (Query string) [owner] Tribe's owner id. Ignored if affiliated query exists
 * @apiParam (Query string) [affiliated] "created" for tribes user has created, "joined" for tribes user has joined, "content" for tribes you can post content
 *                                       for and "all" for both options
 * @apiParam (Query string) [page] Page number
 * @apiParam (Query string) [itemsPerPage] Items per page number
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1647244432019,
 *   "data": {
 *     "tribes": [
 *       {
 *         "_id": "61f9245990b8871a936deecb",
 *         "name": "gigigugu",
 *         "ownerId": "6034e1c050d293417149305f",
 *         "image": {},
 *         "numberOfMembers": 1
 *       },
 *       {
 *         "_id": "61f9277490b8871a936deed1",
 *         "image": {
 *           "originalName": "scaled_Screenshot_20210308_104549_com.jpg",
 *           "size": 222331,
 *           "mimeType": "image/jpeg",
 *           "nameOnServer": "upload_c0158b88423403209582afab02e16c9d",
 *           "link": "/tmp/upload_c0158b88423403209582afab02e16c9d",
 *           "thumbnailName": "thumb_c0158b88423403209582afab02e16c9d"
 *         },
 *         "name": "gjfjg",
 *         "ownerId": "6034e1c050d293417149305f",
 *         "numberOfMembers": 0
 *       },
 *     ],
 *     "pagination": {
 *       "itemsPerPage": 10,
 *       "page": 1,
 *       "total": 2
 *     }
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
 */

router.get("/", auth({ allowUser: true }), async (request, response) => {
  try {
    const userId = request.user._id.toString();
    const { name, owner, affiliated } = request.query;
    const page = +request.query.page || 1;
    const itemsPerPage = +request.query.itemsPerPage || Const.newPagingRows;

    const searchQuery = {};
    if (name) {
      searchQuery.name = { $regex: new RegExp(name, "i") };
    }

    if (affiliated) {
      switch (affiliated) {
        case "content":
          searchQuery["$or"] = [
            { ownerId: userId },
            { "members.accepted": { id: userId, role: Const.tribeMemberRoleElder } },
            { "members.accepted": { id: userId, role: Const.tribeMemberRoleCoOwner } },
          ];
          break;
        case "created":
          searchQuery.ownerId = userId;
          break;
        case "joined":
          searchQuery["members.accepted.id"] = userId;
          break;
        case "all":
          searchQuery["$or"] = [{ ownerId: userId }, { "members.accepted.id": userId }];
          break;
      }
    } else if (owner && Utils.isValidObjectId(owner)) {
      searchQuery.ownerId = owner;
      searchQuery.$or = [
        { isHidden: false },
        {
          isHidden: true,
          $or: [{ "members.accepted.id": userId }, { "members.invited.id": userId }],
        },
      ];
    } else {
      searchQuery.isHidden = false;
    }

    const tribeCount = await Tribe.countDocuments(searchQuery);
    const tribes = await Tribe.find(searchQuery)
      .limit(itemsPerPage)
      .sort({ created: -1 })
      .skip((page - 1) * itemsPerPage)
      .lean();

    Base.successResponse(response, Const.responsecodeSucceed, {
      tribes: formatTribes(tribes),
      pagination: { itemsPerPage, page, total: tribeCount },
    });
  } catch (error) {
    Base.newErrorResponse({ response, message: "TribeListController", error });
  }
});

module.exports = router;
