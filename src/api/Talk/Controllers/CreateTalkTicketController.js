"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { TalkTicket } = require("#models");

/**
 * @api {post} /api/v2/talk Create Lets talk ticket flom_v1
 * @apiVersion 2.0.10
 * @apiName  Create Lets talk ticket flom_v1
 * @apiGroup WebAPI Lets Talk
 * @apiDescription  API which is called to create a new ticket from the Let's talk web page on FLOM.
 *
 * @apiParam {string} phonenumber     Ticket creator's phonenumber
 * @apiParam {string} firstname       Ticket creator's first name
 * @apiParam {string} lastname        Ticket creator's last name
 * @apiParam {string} companyname     Ticket creator's company name
 * @apiParam {string} companywebsite  Ticket creator's company website
 * @apiParam {string} businessemail   Ticket creator's business email address
 * @apiParam {string} [tellusmore]    More info about the ticket written by the creator
 * @apiParam {string} [jobtitle]      Ticket creator's job title
 * @apiParam {string} [help]          The kind of issue the ticket creator needs help with
 * @apiParam {string} [country]       Ticket creator's country
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1663852594685,
 *     "data": {
 *         "ticket": {
 *             "status": 1,
 *             "created": 1663852594649,
 *             "phonenumber": "+385958710205",
 *             "firstname": "stipe",
 *             "lastname": "stipan",
 *             "companyname": "pm d.o.o.",
 *             "companywebsite": "wwww.pm.hr",
 *             "businessemail": "pave.makadam@pm.hr",
 *             "tellusmore": "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
 *             "jobtitle": "abcd",
 *             "help": "Video",
 *             "country": "Croatia",
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
 * @apiError (Errors) 443351 Invalid email
 * @apiError (Errors) 443630 No companyname parameter
 * @apiError (Errors) 443631 No companywebsite parameter
 * @apiError (Errors) 443632 No businessemail parameter
 */

router.post("/", async (request, response) => {
  try {
    const {
      errorCode,
      errorMessage,
      phonenumber,
      firstname,
      lastname,
      companyname,
      companywebsite,
      businessemail,
      tellusmore,
      jobtitle,
      help,
      country,
    } = handleInputs(request.body);

    if (errorCode) {
      return Base.newErrorResponse({
        response,
        code: errorCode,
        message: errorMessage,
      });
    }

    let newTalkTicket = await TalkTicket.create({
      phonenumber,
      firstname,
      lastname,
      companyname,
      companywebsite,
      businessemail,
      tellusmore,
      jobtitle,
      help,
      country,
    });

    newTalkTicket = newTalkTicket.toObject();
    newTalkTicket.id = newTalkTicket._id.toString();
    delete newTalkTicket._id;

    const baseUrlInput =
      Config.environment !== "production" ? "https://qrios.flom.dev" : "https://qrios.com";
    const toEmail =
      Config.environment !== "production"
        ? "marko.rajakovic@pontistechnology.com"
        : "website@qrios.com";
    const templatePath = "src/email-templates/qriosLetsTalk.html";
    const templateDataInput = {
      baseUrl: baseUrlInput,
      firstname,
      lastname,
      country,
      phonenumber,
      companyname,
      companywebsite,
      jobtitle,
      help,
      tellusmore,
      businessemail,
    };

    Utils.sendEmailFromTemplate({
      to: toEmail,
      from: businessemail,
      subject: `Let's talk from ${firstname} ${lastname}.`,
      templatePath,
      templateDataInput,
      baseUrlInput,
    });

    Base.successResponse(response, Const.responsecodeSucceed, { ticket: newTalkTicket });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "CreateTalkTicketController, POST",
      error,
    });
  }
});

function handleInputs(body) {
  const {
    phonenumber: rawPhoneNumber,
    firstname,
    lastname,
    companyname,
    companywebsite,
    businessemail,
    tellusmore,
    jobtitle,
    help,
    country,
  } = body;

  if (!rawPhoneNumber) {
    return {
      errorCode: Const.responsecodeNoPhoneNumber,
      errorMessage: "CreateTalkTicketController, POST - no phone number parameter",
    };
  }
  const phonenumber = Utils.formatPhoneNumber({ phoneNumber: rawPhoneNumber });

  if (!phonenumber)
    return {
      errorCode: Const.responsecodeInvalidPhoneNumber,
      errorMessage: "CreateTalkTicketController, POST - phone number invalid",
    };
  if (!firstname) {
    return {
      errorCode: Const.responsecodeNoFirstName,
      errorMessage: "CreateTalkTicketController, POST - no first name parameter",
    };
  }
  if (!lastname) {
    return {
      errorCode: Const.responsecodeNoLastName,
      errorMessage: "CreateTalkTicketController, POST - no last name parameter",
    };
  }
  if (!companyname) {
    return {
      errorCode: Const.responsecodeNoCompanyName,
      errorMessage: "CreateTalkTicketController, POST - no company name parameter",
    };
  }
  if (!companywebsite) {
    return {
      errorCode: Const.responsecodeNoCompanyWebSite,
      errorMessage: "CreateTalkTicketController, POST - no company website parameter",
    };
  }
  if (!businessemail) {
    return {
      errorCode: Const.responsecodeNoBusinessEmail,
      errorMessage: "CreateTalkTicketController, POST - no business email address parameter",
    };
  }
  if (!Utils.isEmail(businessemail))
    return {
      errorCode: Const.responsecodeInvalidEmail,
      errorMessage: "CreateTalkTicketController, POST - invalid email",
    };

  return {
    phonenumber,
    firstname,
    lastname,
    companyname,
    companywebsite,
    businessemail,
    tellusmore,
    jobtitle,
    help,
    country,
  };
}

module.exports = router;
