"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { LiveStream, User, Tribe } = require("#models");

// const findUserProps = { phoneNumber: 1, userName: 1, created: 1, avatar: 1, bankAccounts: 1 };

/**
 * @api {get} /api/v2/livestreams/:liveStreamId/comments Get comments of live stream flom_v1
 * @apiVersion 2.0.19
 * @apiName  Get comments of live stream flom_v1
 * @apiGroup WebAPI Live Stream
 * @apiDescription  Get comments of live stream, sorted by created timestamp in descending order.
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiParam (Query string) {String}  [commentId]  id of cutoff comment (if not sent, every comment is included)
 * @apiParam (Query string) {String}  [page]       Page number
 * @apiParam (Query string) {String}  [size]       Page size
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1714743825741,
 *     "data": {
 *         "comments": [
 *            {
 *              "commentType": "String",
 *              "commentId": "String",
 *              "text": "String",
 *              "gifData": {},
 *              "stickerData": {},
 *              "created": "Number", in milliseconds
 *              "user": {
 *                "_id": "String",
 *                "phoneNumber": "String",
 *                "userName": "String",
 *                "created": "Number",
 *                "avatar": {},
 *              },
 *            },
 *         ],
 *         "paginationData": {
 *             "page": 1,
 *             "size": 10,
 *             "total": 0,
 *             "hasNext": false
 *         }
 *     }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443855 Live stream not found
 * @apiError (Errors) 443858 User not allowed
 * @apiError (Errors) 4000007 Token invalid
 */

router.get(
  "/:liveStreamId/comments",
  auth({ allowUser: true }),
  async function (request, response) {
    try {
      const { user } = request;
      const { liveStreamId } = request.params;
      const { page: p, size: s, commentId } = request.query;
      const blocked = user.blocked || [];

      if (!Utils.isValidObjectId(liveStreamId)) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidLiveStreamId,
          message: `GetCommentsController - invalid liveStreamId: ${liveStreamId}`,
        });
      }

      const liveStream = await LiveStream.findById(liveStreamId).lean();

      if (!liveStream) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeLiveStreamNotFound,
          message: "GetCommentsController - live stream not found",
        });
      }

      if (!(await isUserAllowed({ liveStream, userId: user._id.toString() }))) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeUserNotAllowed,
          message: "GetCommentsController - user not allowed",
        });
      }

      const page = !p ? 1 : +p;
      const size = !s ? Const.newPagingRows : +s;

      let { comments = [] } = liveStream;
      comments = comments.filter(
        (comment) =>
          comment !== null && comment.isDeleted === false && !blocked.includes(comment.sender._id),
      );
      comments.sort((a, b) => b.created - a.created);

      let slicedComments = [];
      if (!commentId) {
        slicedComments = comments;
      } else {
        const index = comments.findIndex((comment) => comment.commentId === commentId);
        slicedComments = comments.slice(index + 1);
      }

      const total = slicedComments.length;
      const hasNext = page * size < total;

      const paginatedComments =
        total === 0 ? [] : slicedComments.slice((page - 1) * size, (page - 1) * size + size);

      const responseData = {
        comments: paginatedComments,
        paginationData: { page, size, total, hasNext },
      };
      Base.successResponse(response, Const.responsecodeSucceed, responseData);
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "GetCommentsController",
        error,
      });
    }
  },
);

async function isUserAllowed({ liveStream, userId }) {
  const { userId: streamUserId, visibility, communityIds, tribeIds } = liveStream;

  if (streamUserId === userId) return true;

  if (visibility === "public") return true;

  const memberIds = [];

  if (visibility === "tribes") {
    const tribes = await Tribe.find({ _id: { $in: tribeIds } }).lean();

    for (const tribe of tribes) {
      const {
        members: { accepted },
      } = tribe;

      for (const member of accepted) {
        memberIds.push(member.id);
      }
    }
  }

  if (visibility === "community") {
    const members = await User.find({ "memberships.id": { $in: communityIds } }).lean();

    for (const member of members) {
      memberIds.push(member._id.toString());
    }
  }

  return memberIds.includes(userId);
}

module.exports = router;
