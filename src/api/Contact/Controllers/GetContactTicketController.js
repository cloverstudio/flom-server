"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { ContactTicket } = require("#models");

/**
 * @api {get} /api/v2/contact/:ticketId Get Contact us ticket flom_v1
 * @apiVersion 2.0.10
 * @apiName  Get Contact us ticket flom_v1
 * @apiGroup WebAPI Contact Us
 * @apiDescription  API which is called to fetch a Contact us ticket with ticketId.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1663852594685,
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
 *             "industry": "Mining",
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
 * @apiError (Errors) 443682 Contact ticket not found
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
          code: Const.responsecodeNoContactTicketId,
          message: "GetContactTicketController, GET single - no ticket id parameter",
        });
      }

      const contactTicket = await ContactTicket.findOne({ _id: ticketId }).lean();

      if (!contactTicket) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeContactTicketNotFound,
          message: "GetContactTicketController, GET single - contact ticket not found",
        });
      }

      contactTicket.id = contactTicket._id.toString();
      delete contactTicket._id;

      Base.successResponse(response, Const.responsecodeSucceed, { ticket: contactTicket });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "GetContactTicketController, GET single",
        error,
      });
    }
  },
);

/**
 * @api {get} /api/v2/contact Get Contact us tickets flom_v1
 * @apiVersion 2.0.10
 * @apiName  Get Contact us tickets flom_v1
 * @apiGroup WebAPI Contact Us
 * @apiDescription  API which is called to fetch Contact us tickets.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiParam (Query string) {String} [id]             Ticket id
 * @apiParam (Query string) {String} [status]         Ticket status (1 - submitted, 2 - in progress, 3 - completed, 4 - supervisor requested)
 * @apiParam (Query string) {String} [phoneNumber]    Ticket creator's phonenumber
 * @apiParam (Query string) {String} [email]          Ticket creator's email address
 * @apiParam (Query string) {String} [firstName]      Ticket creator's first name
 * @apiParam (Query string) {String} [lastName]       Ticket creator's last name
 * @apiParam (Query string) {String} [businessName]   Ticket creator's business name
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
 *                 "status": 1,
 *                 "created": 1663852594649,
 *                 "phoneNumber": "+385958710205",
 *                 "firstName": "stipe",
 *                 "lastName": "stipan",
 *                 "businessName": "pm d.o.o.",
 *                 "website": "wwww.pm.hr",
 *                 "email": "pave.makadam@pm.hr",
 *                 "zipCode": "21000",
 *                 "industry": "Mining",
 *                 "revenue": "$5k - $10k",
 *                 "__v": 0,
 *                 "id": "632c6032530ea039a4c9aaa5"
 *             },
 *             {
 *                 "status": 1,
 *                 "created": 1663852594648,
 *                 "phoneNumber": "+385958710206",
 *                 "firstName": "stip",
 *                 "lastName": "stipa",
 *                 "businessName": "pp d.o.o.",
 *                 "website": "wwww.pp.hr",
 *                 "email": "pave.pakadam@pm.hr",
 *                 "zipCode": "21000",
 *                 "industry": "Diving",
 *                 "revenue": "$5k - $10k",
 *                 "__v": 0,
 *                 "id": "632c6032530ea039a4c9aaa6"
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
      phoneNumber,
      firstName,
      lastName,
      email,
      businessName,
      page: tempPage,
      offset: tempOffset,
    } = request.query;

    const page = !tempPage ? 1 : +tempPage;
    const offset = !tempOffset ? Const.newPagingRows : +tempOffset;
    const status = !tempStatus || [1, 2, 3, 4].indexOf(+tempStatus) === -1 ? 0 : +tempStatus;

    const query = {};
    if (id) query._id = id;
    if (phoneNumber) query.phoneNumber = phoneNumber;
    if (email) query.email = email;
    if (firstName) query.firstName = firstName;
    if (lastName) query.lastName = lastName;
    if (businessName) query.businessName = businessName;
    if (status) query.status = status;

    const contactTickets = await ContactTicket.find(query).lean();
    contactTickets.sort((a, b) => b.created - a.created);

    let finalContactTickets;
    if (contactTickets.length === 0) finalContactTickets = [];
    else {
      finalContactTickets = contactTickets.slice((page - 1) * offset, page * offset);
      finalContactTickets.forEach((contactTicket) => {
        contactTicket.id = contactTicket._id.toString();
        delete contactTicket._id;
      });
    }

    const responseData = {
      tickets: finalContactTickets,
      pagination: {
        total: contactTickets.length,
        itemsPerPage: offset,
        hasNext: page * offset < contactTickets.length,
      },
    };

    Base.successResponse(response, Const.responsecodeSucceed, responseData);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "GetContactTicketController, GET",
      error,
    });
  }
});

module.exports = router;
