"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { SupportTicket } = require("#models");
const { sendBonus } = require("#logics");

/**
 * @api {post} /api/v2/support/send-bonus Send bonus for support ticket flom_v1
 * @apiVersion 2.0.25
 * @apiName  Send bonus for support ticket flom_v1
 * @apiGroup WebAPI Support
 * @apiDescription  API to send bonus for user submitting a valid support ticket (only bug reports allowed). Access allowed only for admin page, for support ticket reviewer, admin, superadmin.
 *
 * @apiHeader {String} access-token Users unique access token. Admin page only: support ticket reviewer, admin, superadmin.
 *
 * @apiParam {String}  supportTicketId  Id of support ticket (only bug reports allowed)
 * @apiParam {String}  bonusType        Type of bonus ("credits")
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
 *  }
 *
 * @apiError (Errors) 443340 supportTicketId not valid
 * @apiError (Errors) 443923 bonusType not valid
 * @apiError (Errors) 443341 Support ticket with supportTicketId not found
 * @apiError (Errors) 443226 Invalid ticket type (only bug_report allowed)
 * @apiError (Errors) 4000007 Token invalid
 */

router.post(
  "/",
  auth({
    allowAdmin: true,
    includedRoles: [Const.Role.SUPPORT_TICKET_REVIEWER, Const.Role.ADMIN, Const.Role.SUPER_ADMIN],
  }),
  async function (request, response) {
    try {
      const { supportTicketId, bonusType } = request.body;

      if (!supportTicketId || !Utils.isValidObjectId(supportTicketId)) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeSupportTicketIdNotValid,
          message: `SupportBonusController, invalid supportTicketId ${supportTicketId}`,
        });
      }

      if (!bonusType || !["credits"].includes(bonusType)) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidBonusType,
          message: `SupportBonusController, invalid bonusType ${bonusType}`,
        });
      }

      const ticket = await SupportTicket.findById(supportTicketId).lean();
      if (!ticket) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeSupportTicketNotFound,
          message: `SupportBonusController, support ticket ${supportTicketId} not found`,
        });
      }

      if (ticket.type !== "bug_report") {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidTypeParameter,
          message: `SupportBonusController, invalid ticket type: ${ticket.type}`,
        });
      }

      const { userId } = ticket;

      await sendBonus({ userId, bonusType: Const.bonusTypeBugReport, supportTicketId });

      Base.successResponse(response, Const.responsecodeSucceed);
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "SupportBonusController",
        error,
      });
    }
  },
);

module.exports = router;
