"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const Utils = require("#utils");
const { Tribe } = require("#models");

/**
 * @api {post} /api/v2/user/tribes Is user tribe member or owner flom_v1
 * @apiVersion 2.0.21
 * @apiName  Is user tribe member or owner flom_v1
 * @apiGroup WebAPI User
 * @apiDescription  Is user tribe member or owner
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiParam {String[]}  tribeIds  Array of tribe ids.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1715333213824,
 *     "data": {
 *         "tribes": [
 *             {
 *                 "tribeId": "6630befa1bede67f3287f5a1",
 *                 "isOwner": false,
 *                 "isMember": true
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
 * @apiError (Errors) 443860 Invalid tribe ids parameter
 * @apiError (Errors) 443861 Invalid tribe id
 * @apiError (Errors) 443474 Tribe not found
 * @apiError (Errors) 4000007 Token invalid
 */

router.post("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const userId = request.user._id.toString();
    const { tribeIds } = request.body;

    if (!tribeIds || !Array.isArray(tribeIds)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidTribeIdsParam,
        message: "IsUserTribeMemberController - invalid tribeIds parameter",
      });
    }

    for (const id of tribeIds) {
      if (!Utils.isValidObjectId(id)) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidTribeId,
          message: `IsUserTribeMemberController - invalid tribeId: ${id}`,
        });
      }

      const tribe = await Tribe.findById(id);

      if (!tribe) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeTribeNotFound,
          message: `IsUserTribeMemberController - tribe ${id} not found`,
        });
      }
    }

    const tribesResponseArray = [];

    const tribes = await Tribe.find({ _id: { $in: tribeIds } }).lean();

    for (const tribe of tribes) {
      const dataToPush = {
        tribeId: tribe._id.toString(),
        isOwner: false,
        isMember: false,
      };

      const {
        ownerId,
        members: { accepted },
      } = tribe;

      if (userId === ownerId) dataToPush.isOwner = true;

      for (const member of accepted) {
        if (userId === member.id) dataToPush.isMember = true;
      }

      tribesResponseArray.push(dataToPush);
    }

    const responseData = { tribes: tribesResponseArray };
    Base.successResponse(response, Const.responsecodeSucceed, responseData);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "IsUserTribeMemberController",
      error,
    });
  }
});

module.exports = router;
