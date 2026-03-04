"use strict";

const router = require("express").Router();
const Base = require("../../Base");

/*
      * @api {get} /api/v2/flomussd Push Service Controller
      * @apiName Push Service Controller
      * @apiGroup WebAPI
      * @apiDescription Push Service Controller
      *   
      * @apiQueryParam {String} refName refName
      * @apiQueryParam {String} subscriber subscriber
      * @apiQueryParam {String} type type
      * 
      * @apiSuccessExample Success-Response:
        Response needs to be text or valid xml
 
     */

router.get("/", (request, response) => {
  try {
    const type = Number(request.query.type);
    const subscriber = request.query.subscriber;
    const message = request.query.message;
    console.log("\n\n++++++++++++++++++++++", request.query, "\n\n++++++++++++++++++++++");
    switch (type) {
      case 1:
        // send xml page with receipt and option to download the Flom
        response.type("application/xml");
        response.send(
          `<?xml version='1.0' encoding='UTF-8'?><page version="2.0"><div>${message} just sent you Airtime using Flom. Talk, share culture, get Paid.<br/><br/> Download Flom ?</div><navigation id="form"><link accesskey="1" pageId="https://app.qrios.pw/api/v2/user/sendinvitation?ref=${message}&amp;number=0${subscriber}">Yes</link><link accesskey="2" pageId="https://app.qrios.pw/api/v2/flomussd?type=3&amp;subscriber=${subscriber}">No</link></navigation></page>`,
        );
        break;
      case 2:
        response.type("application/xml");
        response.send(`<page><div>${message}</div></page>`);
        break;
      case 3:
        console.log("user doesn't wont to download Flom", subscriber);
        response.type("application/xml");
        response.send(`<page><div>Thank you for canceling this service.</div></page>`);
        break;
      default:
        console.log("Unknown type in push service controller", type);
        response.type("application/xml");

        response.send("<page><div>test</div></page>");
    }
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "PushServiceController",
      error,
    });
  }
});

module.exports = router;
