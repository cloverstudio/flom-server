"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { Review, LiveStream, SupportTicket } = require("#models");

/**
 * @api {delete} /api/v2/admin-page/remove-comment Remove comment flom_v1
 * @apiVersion 2.0.27
 * @apiName  Remove comment flom_v1
 * @apiGroup WebAPI Admin page
 * @apiDescription  Remove comment.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiParam (Query string) {String} supportTicketId  support ticket id
 *
 * @apiSuccessExample Success Response
 * {
 *   "code": 1,
 *   "time": 1590000125608,
 *   "data": {}
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 443340 Invalid support ticket id
 * @apiError (Errors) 443340 Support ticket not found
 * @apiError (Errors) 443226 Invalid ticket type
 * @apiError (Errors) 443393 Review not found
 * @apiError (Errors) 443855 Live stream comment not found
 * @apiError (Errors) 4000007 Token invalid
 */

router.delete(
  "/",
  auth({ allowAdmin: true, role: Const.Role.ADMIN }),
  async function (request, response) {
    try {
      const { supportTicketId } = request.query;

      if (!supportTicketId || !Utils.isValidObjectId(supportTicketId)) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeSupportTicketIdNotValid,
          message: "RemoveCommentController, id missing",
        });
      }

      const supportTicket = await SupportTicket.findById(supportTicketId).lean();

      if (!supportTicket) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeSupportTicketNotFound,
          message: "RemoveCommentController, support ticket not found",
        });
      }

      if (supportTicket.type !== "content_comment") {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidTypeParameter,
          message: "RemoveCommentController, wrong support ticket type",
        });
      }

      const refId = supportTicket.referenceId;

      if (Utils.isValidObjectId(refId)) {
        const review = await Review.findByIdAndUpdate(
          refId,
          { isDeleted: true },
          { lean: true, new: true },
        );

        if (!review) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeReviewNotFound,
            message: "RemoveCommentController, review not found",
          });
        }
      } else {
        const liveStream = await LiveStream.findOneAndUpdate(
          { "comments.commentId": refId },
          { "comments.$.isDeleted": true },
          { new: true, lean: true },
        );

        if (!liveStream) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeLiveStreamNotFound,
            message: "RemoveCommentController, live stream not found",
          });
        }
      }

      Base.successResponse(response, Const.responsecodeSucceed);
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "RemoveCommentController",
        error,
      });
    }
  },
);

module.exports = router;
