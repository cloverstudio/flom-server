"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const, Config } = require("#config");
const { auth } = require("#middleware");
const Utils = require("#utils");
const { User } = require("#models");
const { xml2js } = require("xml-js");

/*
 * @api {post} /api/v2/user/merchantenrollment Post Merchant Enrollment
 * @apiName Post Merchant Enrollment
 * @apiGroup WebAPI User
 * @apiDescription Used to complete registration for merchant , once complete the merchant receives a seller code
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {String} phoneNumber phoneNumber
 * @apiParam {String} merchantDOB merchantDOB
 * @apiParam {object} financialInstitutionCode financialInstitutionCode {"name":"Name", "accountNumber":"023****163", "code": "000017"}
 *
 * @apiSuccessExample Success-Response:
 * {
 *   "code": 1,
 *   "time": 1536317093821,
 *   "data": {
 *     "merchantCode": "40206730"
 *   }
 * }
 */

router.post("/", auth({ allowUser: true }), async (request, response) => {
  try {
    const phoneNumber = request.body.phoneNumber;

    const bank = request.body.financialInstitutionCode.replace(/'/g, '"');
    const bankObj = JSON.parse(bank);
    const merchantDOB = request.body.merchantDOB;

    let user = await User.findOne({ _id: request.user._id });

    //check for required values
    if (!phoneNumber) {
      logger.error("MerchantEnrollmentController, missing phoneNumber!");
      return Base.successResponse(response, Const.responsecodeNoPhoneNumber);
    }

    if (!bank) {
      logger.error("MerchantEnrollmentController, missing financialInstitutionCode!");
      return Base.successResponse(response, Const.responsecodeNoFinancialInstitutionCode);
    }

    if (!merchantDOB) {
      logger.error("MerchantEnrollmentController, missing merchantDOB!");
      return Base.successResponse(response, Const.responsecodeNoMerchantDOB);
    }

    if (Const.fakePhoneNumbers.indexOf(phoneNumber) !== -1) {
      const merchantCode = await Utils.generateFakeMerchantCode();

      const newBankAccount = {
        ...bankObj,
        merchantCode,
        selected: user.bankAccounts.length ? false : true,
      };

      user.bankAccounts.push(newBankAccount);
      user.markModified("bankAccounts");
      user.status = 1;
      user.typeAcc = Const.userTypeMerchant;
      user.merchantDOB = merchantDOB;
      await user.save();
      return Base.successResponse(response, Const.responsecodeSucceed, { merchantCode });
    }

    const requestBody = generateRequest(phoneNumber, bankObj, merchantDOB);

    logger.info(
      "MerchantEnrollmentController, merchant enrolment reqBody " + JSON.stringify({ requestBody }),
    );

    const foundBankIndex = findBankIndex(user.bankAccounts, bankObj);

    const merchantCodeExists =
      foundBankIndex > -1 &&
      user.bankAccounts[foundBankIndex] &&
      user.bankAccounts[foundBankIndex].merchantCode;

    logger.info(JSON.stringify({ merchantCodeExists, foundBankIndex }));

    if (merchantCodeExists) {
      const existingMerchantCode = user.bankAccounts[foundBankIndex].merchantCode;
      const oldUserAccounts = user.bankAccounts.toObject();
      const newUserAccounts = oldUserAccounts.map((b, i) => ({
        ...b,
        selected: i === foundBankIndex,
      }));

      user.status = 1;
      user.bankAccounts = newUserAccounts;
      user.typeAcc = 1;
      user.merchantDOB = merchantDOB;

      await user.save();
      return Base.successResponse(response, Const.responsecodeSucceed, {
        merchantCode: existingMerchantCode,
      });
    }

    const xmlResponseData = await Utils.sendRequest({
      method: "POST",
      url: Config.selfRegistrationPostUrl,
      body: requestBody,
      headers: {
        "Content-Type": "text/xml",
        charset: "utf-8",
      },
    });

    logger.info(
      "MerchantEnrollmentController, merchant enrolment XML response: " +
        JSON.stringify({
          xmlResponseData,
        }),
    );
    /* 
      const dataX =
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><MerchantSelfRegistrationResponse><SessionID>080001180907082505435070205860</SessionID><RequestorID>080001</RequestorID><MerchantPhoneNumber>08034022578</MerchantPhoneNumber><MerchantCode>40206730</MerchantCode><ResponseCode>00</ResponseCode><ResponseDescription>Successful</ResponseDescription></MerchantSelfRegistrationResponse>';
 */
    const registrationResponse = convertToObject(xmlResponseData);

    logger.info(
      "MerchantEnrollmentController, merchant enrolment JS response: " +
        JSON.stringify({
          registrationResponse,
        }),
    );

    const { ResponseCode: responseCode, ResponseDescription: responseDescription } =
      registrationResponse;

    /* { _declaration: 
                    { _attributes: { version: '1.0', encoding: 'UTF-8', standalone: 'yes' } },
                   MerchantSelfRegistrationResponse: 
                    { SessionID: { _text: '080001180907082505435070205860' },
                      RequestorID: { _text: '080001' },
                      MerchantPhoneNumber: { _text: '08034022578' },
                      MerchantCode: { _text: '40206730' },
                      ResponseCode: { _text: '00' },
                      ResponseDescription: { _text: 'Successful' } } } */

    if (responseCode !== "00") {
      const errorCode = Utils.getMCashErrorCode(responseCode);
      logger.error("MCash Error: " + JSON.stringify(responseDescription));

      return Base.successResponse(response, errorCode);
    }

    const { MerchantCode: merchantCode } = registrationResponse;

    let newBank = {
      ...bankObj,
      merchantCode,
      selected: true,
    };

    user.status = 1;
    user.typeAcc = 1;
    user.merchantDOB = merchantDOB;
    user.bankAccounts.push(newBank);
    user.createdBusinessInFlom = true;

    user.modified = Date.now();
    await user.save();

    return Base.successResponse(response, Const.responsecodeSucceed, {
      merchantCode,
    });
  } catch (e) {
    return Base.errorResponse(
      response,
      Const.httpCodeServerError,
      "MerchantEnrollmentController",
      e,
    );
  }
});

async function generateRequest(phoneNumber, bankObj, merchantDOB) {
  const sessionId = Utils.generateRandomNumber(16);
  const telco = await Utils.getTelco(phoneNumber);
  const bankName = bankObj.name;
  const bankCode = bankObj.code;
  const bankAccountNumber = bankObj.accountNumber;

  return `<MerchantSelfRegistrationRequest><SessionID>${sessionId}</SessionID><Telco>${telco}</Telco><MerchantPhoneNumber>${phoneNumber}</MerchantPhoneNumber><PaymentNotificationPhoneNumber>${phoneNumber}</PaymentNotificationPhoneNumber><FinancialInstitutionCode Name="${bankName}" accountNumber="${bankAccountNumber}">${bankCode}</FinancialInstitutionCode><MerchantDOB>${merchantDOB}</MerchantDOB></MerchantSelfRegistrationRequest>`;
}

function findBankIndex(bankArr, bank) {
  const { name, accountNumber } = bank;
  return bankArr.findIndex((b) => b.name === name && b.accountNumber === accountNumber);
}

function convertToObject(data) {
  const options = { ignoreComment: true, compact: true };
  const converted = xml2js(data, options);

  const responseKey = Object.keys(converted).filter((key) => !key.startsWith("_"));

  const responseObj = converted[responseKey[0]];
  const response = Object.keys(responseObj)
    .map((key) => ({
      [key]: responseObj[key]._text,
    }))
    .reduce((acc, curr) => ({ ...acc, ...curr }), {});

  return response;
}

module.exports = router;
