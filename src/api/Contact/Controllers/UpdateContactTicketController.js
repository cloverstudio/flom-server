"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { ContactTicket } = require("#models");

/**
 * @api {patch} /api/v2/contact/:ticketId Update Contact us ticket flom_v1
 * @apiVersion 2.0.10
 * @apiName  Update Contact us ticket flom_v1
 * @apiGroup WebAPI Contact Us
 * @apiDescription  API which is called to update a Contact us ticket.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiParam {String} status  Contact us ticket status (1 - submitted, 2 - in progress, 3 - completed, 4 - supervisor requested)
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1663855221481,
 *     "data": {
 *         "ticket": {
 *             "status": 1,
 *             "created": 1663852594649,
 *             "phoneNumber": "+385958710205",
 *             "firstName": "stipe",
 *             "lastName": "stipan",
 *             "businessName": "pm d.o.o.",
 *             "website": "wwww.pm.hr",
 *             "email": "pave.makadam@pm.hr",
 *             "zipCode": "21000",
 *             "industry": "Sailing",
 *             "revenue": "$5k - $10k",
 *             "__v": 0,
 *             "id": "632c6032530ea039a4c9aaa5"
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
 * @apiError (Errors) 443681 No ticketId parameter
 * @apiError (Errors) 443682 Talk ticket not found
 * @apiError (Errors) 443635 No status parameter
 * @apiError (Errors) 443636 Invalid status parameter
 * @apiError (Errors) 4000007 Token invalid
 */

router.patch(
  "/:ticketId",
  auth({ allowAdmin: true, role: Const.Role.ADMIN }),
  async (request, response) => {
    try {
      const { ticketId } = request.params;
      const { status } = request.body;

      if (!ticketId) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeNoContactTicketId,
          message: "UpdateContactTicketController, PATCH - no ticket id parameter",
        });
      }

      if (!status) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeNoStatusParameter,
          message: "UpdateContactTicketController, PATCH - no status parameter",
        });
      }
      if ([1, 2, 3, 4].indexOf(status) === -1) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidStatusParameter,
          message: "UpdateContactTicketController, PATCH - invalid status parameter",
        });
      }

      let contactTicket = await ContactTicket.findByIdAndUpdate(
        ticketId,
        { status, modified: Date.now() },
        { new: true },
      ).lean();

      if (!contactTicket) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeContactTicketNotFound,
          message: "UpdateContactTicketController, PATCH - contact ticket not found",
        });
      }

      contactTicket.id = contactTicket._id.toString();
      delete contactTicket._id;

      Base.successResponse(response, Const.responsecodeSucceed, {
        ticket: contactTicket,
      });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "UpdateContactTicketController, PATCH",
        error,
      });
    }
  },
);

module.exports = router;
