"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { ContactTicket } = require("#models");

/**
 * @api {post} /api/v2/contact Create Contact us ticket flom_v1
 * @apiVersion 2.0.10
 * @apiName  Create Contact us ticket flom_v1
 * @apiGroup WebAPI Contact Us
 * @apiDescription  API which is called to create a new ticket from the Contact us web page on FLOM.
 *
 * @apiParam {String} phoneNumber     Ticket creator's phonenumber
 * @apiParam {String} firstName       Ticket creator's first name
 * @apiParam {String} lastName        Ticket creator's last name
 * @apiParam {String} email           Ticket creator's email address
 * @apiParam {String} businessName    Ticket creator's business name
 * @apiParam {String} [message]       Ticket creator's message
 * @apiParam {String} [website]       Ticket creator's website
 * @apiParam {String} [zipCode]       Ticket creator's zipcode
 * @apiParam {String} [industry]      Ticket creator's industry
 * @apiParam {String} [revenue]       Ticket creator's revenue
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
 * @apiError (Errors) 400180 No phonenumber parameter
 * @apiError (Errors) 443100 No firstname parameter
 * @apiError (Errors) 443101 No lastname parameter
 * @apiError (Errors) 443107 Invalid phonenumber
 * @apiError (Errors) 443216 No email parameter
 * @apiError (Errors) 443351 Invalid email
 * @apiError (Errors) 443680 No businessName parameter
 *
 */

router.post("/", async (request, response) => {
  try {
    const {
      errorCode,
      errorMessage,
      phoneNumber,
      firstName,
      lastName,
      message,
      email,
      businessName,
      zipCode,
      website,
      industry,
      revenue,
    } = handleInputs(request.body);

    if (errorCode) {
      return Base.newErrorResponse({
        response,
        code: errorCode,
        message: errorMessage,
      });
    }

    let newContactTicket = await ContactTicket.create({
      phoneNumber,
      firstName,
      lastName,
      message,
      email,
      businessName,
      zipCode,
      website,
      industry,
      revenue,
    });

    newContactTicket = newContactTicket.toObject();
    newContactTicket.id = newContactTicket._id.toString();
    delete newContactTicket._id;

    Base.successResponse(response, Const.responsecodeSucceed, { ticket: newContactTicket });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "CreateContactTicketController, POST",
      error,
    });
  }
});

function handleInputs(body) {
  const {
    phoneNumber: rawPhoneNumber,
    firstName,
    lastName,
    message,
    email,
    businessName,
    zipCode,
    website,
    industry,
    revenue,
  } = body;

  if (!rawPhoneNumber) {
    return {
      errorCode: Const.responsecodeNoPhoneNumber,
      errorMessage: "CreateContactTicketController, POST - no phone number parameter",
    };
  }

  const phoneNumber = Utils.formatPhoneNumber({ phoneNumber: rawPhoneNumber });
  if (!phoneNumber)
    return {
      errorCode: Const.responsecodeInvalidPhoneNumber,
      errorMessage: "CreateContactTicketController, POST - phone number invalid",
    };

  if (!firstName)
    return {
      errorCode: Const.responsecodeNoFirstName,
      errorMessage: "CreateContactTicketController, POST - no first name parameter",
    };

  if (!lastName)
    return {
      errorCode: Const.responsecodeNoLastName,
      errorMessage: "CreateContactTicketController, POST - no last name parameter",
    };

  if (!email)
    return {
      errorCode: Const.responsecodeNoEmail,
      errorMessage: "CreateContactTicketController, POST - no email parameter",
    };

  if (!Utils.isEmail(email))
    return {
      errorCode: Const.responsecodeInvalidEmail,
      errorMessage: "CreateContactTicketController, POST - invalid email",
    };

  if (!businessName)
    return {
      errorCode: Const.responsecodeNoBusinessName,
      errorMessage: "CreateContactTicketController, POST - no business name parameter",
    };

  return {
    phoneNumber,
    firstName,
    lastName,
    message,
    email,
    businessName,
    zipCode,
    website,
    industry,
    revenue,
  };
}

module.exports = router;
