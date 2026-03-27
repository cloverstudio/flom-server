"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { User } = require("#models");
const { xml2js } = require("xml-js");

/*
      * @api {post} /api/v2/user/sendphonenumber Post Phone Number
      * @apiName Post Phone Number
      * @apiGroup WebAPI
      * @apiDescription Posting merchant msisdn in order to get his bank/account
      *   
      * @apiParam {String} phoneNumber phoneNumber
      * @apiParam {String} UUID UUID
      * @apiParam {String} pushToken pushToken
      * @apiParam {String} activationCode activationCode
      * 
      * @apiSuccessExample Success-Response:
    {
        "code": 1,
        "time": 1536574245001,
        "data": {
            "financials": [
                {
                    "name": "UBA",
                    "accountNumber": "209****198",
                    "code": "000004"
                },
                {
                    "name": "ZENITH",
                    "accountNumber": "211****920",
                    "code": "000015"
                },
                {
                    "name": "DIAMOND",
                    "accountNumber": "009****189",
                    "code": "000005"
                },
                {
                    "name": "UNION",
                    "accountNumber": "005****196",
                    "code": "000018"
                }
            ],
            "userData": {
                "userId": "5b96431fc16d05286aa9b920",
                "phoneNumber": "08034022578",
                "sessionId": 139185148033757020,
                "token": [
                    {
                        "token": "*****",
                        "generateAt": 1536574244973
                    }
                ]
            }
        }
    }

         @apiSuccessExample No merchant found:
        {
            "code": 4000110,
            "time": 1535963217064
        }
 
     */

router.post("/", (request, response) => {
  const phoneNumber = request.body.phoneNumber;
  const activationCode = request.body.activationCode;
  const sessionId = Math.floor(100000000000000000 + Math.random() * 100000000000000000);
  const UUID = request.body.UUID;
  const newPushToken = request.body.pushToken;
  let xmlResponseData = {};

  //check for required values
  if (!phoneNumber) {
    console.log("Missing phoneNumber!");
    return Base.successResponse(response, Const.responsecodeNoPhoneNumber);
  }

  if (!activationCode) {
    console.log("Missing activationCode!");
    return Base.successResponse(response, Const.responsecodeNoActivationCode);
  }

  const requestbody =
    "<Pre-MerchantSelfRegistrationRequest>" +
    "<SessionID>" +
    sessionId +
    "</SessionID>" +
    "<MerchantPhoneNumber>" +
    phoneNumber +
    "</MerchantPhoneNumber>" +
    "</Pre-MerchantSelfRegistrationRequest>";

  (async () => {
    try {
      xmlResponseData = await Utils.sendRequest({
        method: "POST",
        url: Config.preSelfRegistrationPostUrl,
        body: requestbody,
        headers: {
          "Content-Type": "text/xml",
          charset: "utf-8",
        },
        // resolveWithFullResponse: true,
      });

      const options = { ignoreComment: true, compact: true };
      const jsonData = xml2js(xmlResponseData, options);
      const responseDescription =
        jsonData["Pre-MerchantSelfRegistrationResponse"].ResponseDescription._text;

      if (responseDescription != "00") {
        console.log("Merch does not exist!");
        return Base.successResponse(response, Const.merchantDoesntExist);
      } else {
        const financials =
          jsonData["Pre-MerchantSelfRegistrationResponse"].FinancialInstitutions
            .FinancialInstitutionCode;
        let dataToSend = {};
        if (Array.isArray(financials)) {
          dataToSend.financials = financials.map((obj) => {
            let rObj = {};
            rObj["name"] = obj._attributes.Name;
            rObj["accountNumber"] = obj._attributes.accountNumber;
            rObj["code"] = obj._text;
            return rObj;
          });
        } else {
          dataToSend.financials = [
            {
              name: financials._attributes.Name,
              accountNumber: financials._attributes.accountNumber,
              code: financials._text,
            },
          ];
        }

        const findResult = await User.find({ phoneNumber: phoneNumber });

        let user = findResult[0];

        if (!user) {
          console.log("Merchant not found!");
          return Base.successResponse(response, Const.responsecodeMerchantNotFound);
        }

        if (user.activationCode === activationCode) {
          user.activationCode = "";

          // generate token
          const newToken = Utils.getRandomString(Const.tokenLength);
          const now = Utils.now();

          const tokenObj = {
            token: newToken,
            generateAt: now,
          };

          // get token array
          let tokenAry = [];

          // push token into token array
          tokenAry.push(tokenObj);
          const tokenToSend = tokenObj.token.toString();

          // update user
          user.token = tokenAry;

          // UUID stuff
          let uuidAry = [];

          // Insert
          let UUIDObj = {
            UUID: UUID,
            lastLogin: Utils.now(),
            blocked: false,
            lastToken: user.token,
            pushTokens: [],
          };

          if (newPushToken) UUIDObj.pushTokens.push(newPushToken);

          uuidAry.push(UUIDObj);
          user.pushToken = newPushToken;
          user.UUID = uuidAry;

          await user.save();

          dataToSend.userData = {
            userId: user._id,
            phoneNumber: phoneNumber,
            sessionId: sessionId,
            tkn: tokenToSend,
          };

          Base.successResponse(response, Const.responsecodeSucceed, dataToSend);
        } else {
          Base.successResponse(response, Const.responsecodeSignupInvalidActivationCode);
        }
      }
    } catch (e) {
      console.log("Error: ", e);
      Base.errorResponse(response, Const.httpCodeServerError);
      return;
    }
  })();
});

module.exports = router;
