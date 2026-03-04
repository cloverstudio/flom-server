"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { TalkTicket } = require("#models");

/**
 * @api {get} /api/v2/talk/:ticketId Get Let's talk ticket flom_v1
 * @apiVersion 2.0.10
 * @apiName  Get Lets talk ticket flom_v1
 * @apiGroup WebAPI Lets Talk
 * @apiDescription  API which is called to fetch a Let's talk ticket with ticketId.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1663854286746,
 *     "data": {
 *         "ticket": {
 *             "status": 4,
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
 *             "modified": 1663853116772,
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
 * @apiError (Errors) 443634 Contact ticket not found
 * @apiError (Errors) 4000007 Token invalid
 */

router.get(
  "/:ticketId",
  auth({ allowAdmin: true, role: Const.Role.ADMIN }),
  async (request, response) => {
    try {
      const { ticketId } = request.params;

      if (!ticketId) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeNoTalkTicketId,
          message: "GetTalkTicketController, GET single - no ticket id parameter",
        });
      }

      const talkTicket = await TalkTicket.findOne({ _id: ticketId }).lean();

      if (!talkTicket) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeTalkTicketNotFound,
          message: "GetTalkTicketController, GET single - talk ticket not found",
        });
      }

      talkTicket.id = talkTicket._id.toString();
      delete talkTicket._id;

      Base.successResponse(response, Const.responsecodeSucceed, { ticket: talkTicket });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "GetTalkTicketController, GET single",
        error,
      });
    }
  },
);

/**
 * @api {get} /api/v2/talk Get Lets talk tickets flom_v1
 * @apiVersion 2.0.10
 * @apiName  Get Lets talk tickets flom_v1
 * @apiGroup WebAPI Lets Talk
 * @apiDescription  API which is called to fetch Lets talk tickets.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiParam (Query string) {String} [id]             Ticket id
 * @apiParam (Query string) {String} [status]         Ticket status (1 - submitted, 2 - in progress, 3 - completed, 4 - supervisor requested)
 * @apiParam (Query string) {String} [phonenumber]    Ticket creator's phonenumber
 * @apiParam (Query string) {String} [businessemail]  Ticket creator's business email address
 * @apiParam (Query string) {String} [firstname]      Ticket creator's first name
 * @apiParam (Query string) {String} [lastname]       Ticket creator's last name
 * @apiParam (Query string) {String} [companyname]    Ticket creator's company name
 * @apiParam (Query string) {String} [page]           Number of page
 * @apiParam (Query string) {String} [offset]         Number of tickets per page
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1663854950791,
 *     "data": {
 *         "tickets": [
 *             {
 *                 "status": 4,
 *                 "created": 1663852125623,
 *                 "phonenumber": "+385958710202",
 *                 "firstname": "petar",
 *                 "lastname": "biocic",
 *                 "companyname": "pb d.o.o.",
 *                 "companywebsite": "wwww.pb.hr",
 *                 "businessemail": "petar.biocic@pb.hr",
 *                 "tellusmore": "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
 *                 "jobtitle": "abcd",
 *                 "help": "Video",
 *                 "country": "Croatia",
 *                 "__v": 0,
 *                 "modified": 1663853116772,
 *                 "id": "632c5e5d530ea039a4c9aaa1"
 *             },
 *             {
 *                 "status": 1,
 *                 "created": 1663852390186,
 *                 "phonenumber": "+385958710203",
 *                 "firstname": "mate",
 *                 "lastname": "karin",
 *                 "companyname": "pb d.o.o.",
 *                 "companywebsite": "wwww.pb.hr",
 *                 "businessemail": "petar.biocic@pb.hr",
 *                 "tellusmore": "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
 *                 "jobtitle": "abcd",
 *                 "help": "Video",
 *                 "country": "Croatia",
 *                 "__v": 0,
 *                 "id": "632c5f66530ea039a4c9aaa2"
 *             }
 *         ],
 *         "pagination": {
 *             "total": 2,
 *             "itemsPerPage": 3
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
 * @apiError (Errors) 4000007 Token invalid
 */

router.get("/", auth({ allowAdmin: true, role: Const.Role.ADMIN }), async (request, response) => {
  try {
    const {
      id,
      status: tempStatus,
      phonenumber,
      businessemail,
      firstname,
      lastname,
      companyname,
      page: tempPage,
      offset: tempOffset,
    } = request.query;

    const page = !tempPage ? 1 : +tempPage;
    const offset = !tempOffset ? Const.newPagingRows : +tempOffset;
    const status = !tempStatus || [1, 2, 3, 4].indexOf(+tempStatus) === -1 ? 0 : +tempStatus;

    const query = {};
    if (id) query._id = id;
    if (phonenumber) query.phonenumber = phonenumber;
    if (businessemail) query.businessemail = businessemail;
    if (firstname) query.firstname = firstname;
    if (lastname) query.lastname = lastname;
    if (companyname) query.companyname = companyname;
    if (status) query.status = status;

    const talkTickets = await TalkTicket.find(query).lean();
    talkTickets.sort((a, b) => b.created - a.created);

    let finalTalkTickets;
    if (talkTickets.length === 0) finalTalkTickets = [];
    else {
      finalTalkTickets = talkTickets.slice((page - 1) * offset, page * offset);
      finalTalkTickets.forEach((talkTicket) => {
        talkTicket.id = talkTicket._id.toString();
        delete talkTicket._id;
      });
    }

    const responseData = {
      tickets: finalTalkTickets,
      pagination: {
        total: talkTickets.length,
        itemsPerPage: offset,
        hasNext: page * offset < talkTickets.length,
      },
    };

    Base.successResponse(response, Const.responsecodeSucceed, responseData);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "GetTalkTicketController, GET",
      error,
    });
  }
});

module.exports = router;
