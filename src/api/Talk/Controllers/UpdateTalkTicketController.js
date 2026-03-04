"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { TalkTicket } = require("#models");

/**
 * @api {patch} /api/v2/talk/:ticketId Update Lets talk ticket flom_v1
 * @apiVersion 2.0.10
 * @apiName  Update Lets talk ticket flom_v1
 * @apiGroup WebAPI Lets Talk
 * @apiDescription  API which is called to update a Lets talk ticket.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiParam {String} status  Lets talk ticket status (1 - submitted, 2 - in progress, 3 - completed, 4 - supervisor requested)
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1663855221481,
 *     "data": {
 *         "ticket": {
 *             "status": 3,
 *             "created": 1663852125623,
 *             "phonenumber": "+385958710202",
 *             "firstname": "petar",
 *             "lastname": "biocic",
 *             "companyname": "pb d.o.o.",
 *             "companywebsite": "wwww.pb.hr",
 *             "businessemail": "petar.biocic@pb.hr",
 *             "tellusmore": "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
 *             "jobtitle": "abcd",
 *             "help": "Video",
 *             "country": "Croatia",
 *             "__v": 0,
 *             "modified": 1663855221438,
 *             "id": "632c5e5d530ea039a4c9aaa1"
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
 * @apiError (Errors) 443633 No ticketId parameter
 * @apiError (Errors) 443634 Talk ticket not found
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
          code: Const.responsecodeNoTalkTicketId,
          message: "UpdateTalkTicketController, PATCH - no ticket id parameter",
        });
      }

      if (!status) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeNoStatusParameter,
          message: "UpdateTalkTicketController, PATCH - no status parameter",
        });
      }
      if ([1, 2, 3, 4].indexOf(status) === -1) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidStatusParameter,
          message: "UpdateTalkTicketController, PATCH - invalid status parameter",
        });
      }

      let talkTicket = await TalkTicket.findByIdAndUpdate(
        ticketId,
        { status, modified: Date.now() },
        { new: true },
      ).lean();

      if (!talkTicket) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeTalkTicketNotFound,
          message: "UpdateTalkTicketController, PATCH - talk ticket not found",
        });
      }

      talkTicket.id = talkTicket._id.toString();
      delete talkTicket._id;

      Base.successResponse(response, Const.responsecodeSucceed, {
        ticket: talkTicket,
      });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "UpdateTalkTicketController, PATCH",
        error,
      });
    }
  },
);

module.exports = router;
