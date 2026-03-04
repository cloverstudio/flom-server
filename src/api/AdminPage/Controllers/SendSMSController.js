"use strict";

const fsp = require("fs/promises");
const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Config, Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");

/**
 * @api {post} /api/v2/admin-page/send-sms Send SMS
 * @apiVersion 2.0.10
 * @apiName Send SMS
 * @apiGroup WebAPI Admin page
 * @apiDescription Send SMS
 *
 * @apiHeader {String} access-token Users unique access-token. Only admin token allowed.
 *
 * @apiParam {String} message        Message to be sent out in SMS
 * @apiParam {File}   phoneNumbers   File with phone numbers (.txt or .csv)
 *
 * @apiSuccessExample Success Response
 * {
 *   "code": 1,
 *   "time": 1644403934486
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443670 No message parameter
 * @apiError (Errors) 443671 No phoneNumbers file
 * @apiError (Errors) 443672 File type not supported
 * @apiError (Errors) 443673 Invalid structure of phoneNumbers file
 * @apiError (Errors) 443674 No valid phonenumbers in file
 * @apiError (Errors) 4000007 Token not valid
 */

router.post(
  "/",
  auth({ allowAdmin: true, role: Const.Role.ADMIN }),
  async function (request, response) {
    try {
      const customerActivationData = await Utils.getCustomerActivationData();

      if (customerActivationData.totalSpending > customerActivationData.totalSpendingCap) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeTotalSpendingHigherThanSpendingCap,
          message: `SendSMSController - total amount spent higher than spending cap`,
        });
      }

      const { fields = {}, files = {} } = await Utils.formParse(request, {
        keepExtensions: true,
        uploadDir: Config.uploadPath,
      });

      const { message } = fields;
      const { phoneNumbers: phoneNumbersFile } = files;

      if (!message) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeNoMessageParameter,
          message: `SendSMSController - no message parameter`,
        });
      }

      if (!phoneNumbersFile || _.isEmpty(phoneNumbersFile)) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeNoPhoneNumbersFile,
          message: `SendSMSController - no phonenumbers file`,
        });
      }

      const tmp = phoneNumbersFile.name.split(".");
      const extension = tmp[tmp.length - 1];
      if (extension !== "txt" && extension !== "csv") {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeFileTypeNotSupported,
          message: `SendSMSController - file type not supported - only txt & csv`,
        });
      }

      const data = await fsp.readFile(phoneNumbersFile.path, "utf8");
      const dataArray = data.split(",");
      console.log("dataArray: " + dataArray);

      if (dataArray.length === 0) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeFileInvalidStructure,
          message: `SendSMSController - phonenumbers file invalid structure`,
        });
      }

      const phoneNumbers = [];

      for (let i = 0; i < dataArray.length; i++) {
        if (!dataArray[i] || typeof dataArray[i] !== "string") continue;
        if (dataArray[i].trim().length === 0) continue;

        const dataElement = dataArray[i]
          .replace(/,/g, "")
          .replace(/;/g, "")
          .replace(/:/g, "")
          .trim();

        const phoneNumber = dataElement.startsWith("+") ? dataElement : `+${dataElement}`;

        const formattedPhoneNumber = Utils.formatPhoneNumber({ phoneNumber });

        if (
          !formattedPhoneNumber ||
          formattedPhoneNumber.startsWith("+234803200") ||
          formattedPhoneNumber.startsWith("+234810000")
        )
          logger.warn(
            `SendSMSController - phonenumber ${dataElement} / ${formattedPhoneNumber} invalid`,
          );
        else phoneNumbers.push(formattedPhoneNumber);
      }

      console.log("send sms, phoneumbers: " + phoneNumbers.length);

      if (phoneNumbers.length === 0) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeNoValidPhoneNumbersInFile,
          message: `SendSMSController - no valid phonenumbers in file`,
        });
      }

      const smsData = {
        phoneNumbers: phoneNumbers.join(","),
        message,
        type: "admin",
      };

      Utils.callBatchSMSService(smsData);

      Base.successResponse(response, Const.responsecodeSucceed);
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "SendSMSController",
        error,
      });
    }
  },
);

module.exports = router;
