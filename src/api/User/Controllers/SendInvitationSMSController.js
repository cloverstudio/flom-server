"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, Config } = require("#config");
const Utils = require("#utils");

/*
      * @api {get} /api/v2/user/sendinvitation Send invitation to Flom
      * @apiName Send invitation to Flom
      * @apiGroup WebAPI
      * @apiDescription Send SMS invitation to Flom
      *   
      * @queryParam {String} ref ref - name of the person who sends invite
      * @queryParam {String} number number - number of the person who will get sms invitation (format: 02348020000001, 0385977774089... )
      * 
      * @apiSuccessExample Success-Response:
    {
        "code": 1,
        "time": 1536574245001,
        "data": {}
    }
 
     */

router.get("/", async (request, response) => {
  const ref = request.query.ref;
  const number = request.query.number;
  const formatedNumber = number.startsWith("0") ? `+${number.substring(1)}` : number;

  try {
    const messageBody = Const.defaultInviteSMSOverUssd.replace("user.name", ref);
    // check if phone number is Nigerian
    // send sms using Twillio
    try {
      await Utils.sendSMS(formatedNumber, messageBody);
      console.log("************SENT INVITATION LINK ***************", messageBody);
    } catch (error) {
      console.log("error sending message", error);
      return;
    }

    response.type("application/xml");
    response.send(
      `<page><div>Kindly check your message for link to Download Flom. Thank you!</div></page>`,
    );
  } catch (error) {
    console.log(error);
    return Base.errorResponse(response, Const.httpCodeServerError);
  }
});

router.post("/", async (request, response) => {
  try {
    const { phoneNumber, message, opId } = request.body;

    const apiResponse = await Utils.sendRequest({
      method: "POST",
      url: "https://deep.qrios.com/api/v1/sms",
      body: {
        operationId: opId,
        senderName: "Flom",
        recipient: phoneNumber,
        content: message,
      },
      headers: Config.qriosHeaders,
      // resolveWithFullResponse: true,
    });

    console.log(JSON.stringify(apiResponse, null, 4));

    return Base.successResponse(response, Const.responsecodeSucceed);
  } catch (error) {
    console.log(error);
    return Base.errorResponse(response, Const.httpCodeServerError);
  }
});

module.exports = router;
