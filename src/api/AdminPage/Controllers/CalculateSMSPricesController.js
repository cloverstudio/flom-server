"use strict";

const fsp = require("fs/promises");
const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Config, Const, countries } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { SmsPrice } = require("#models");

/**
 * @api {post} /api/v2/admin-page/sms-prices Calculate SMS price flom_v1
 * @apiVersion 2.0.10
 * @apiName Calculate SMS price
 * @apiGroup WebAPI Admin page
 * @apiDescription Calculate SMS price
 *
 * @apiHeader {String} access-token Users unique access-token. Only admin token allowed.
 *
 * @apiParam {File}   phoneNumbers   File with phone numbers (.txt or .csv)
 *
 * @apiSuccessExample Success Response
 * {
 *   "code": 1,
 *   "time": 1644403934486,
 *   "data": {
 *     "totalPrice": 10.66
 *     }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443671 No phoneNumbers file
 * @apiError (Errors) 443672 File type not supported
 * @apiError (Errors) 443673 Invalid structure of phoneNumbers file
 * @apiError (Errors) 4000007 Token not valid
 */

router.post(
  "/",
  auth({ allowAdmin: true, role: Const.Role.ADMIN }),
  async function (request, response) {
    try {
      const smsPrices = await SmsPrice.find({}).lean();
      const smsPricesByCountry = {};
      for (let i = 0; i < smsPrices.length; i++)
        smsPricesByCountry[smsPrices[i].countryCode] = {
          price: smsPrices[i].price,
          modified: smsPrices[i].modified,
        };

      const { files = {} } = await Utils.formParse(request, {
        keepExtensions: true,
        uploadDir: Config.uploadPath,
      });

      const { phoneNumbers: phoneNumbersFile } = files;

      if (!phoneNumbersFile) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeNoPhoneNumbersFile,
          message: `CalculateSMSPriceController - no phonenumbers file`,
        });
      }

      const tmp = phoneNumbersFile.name.split(".");
      const extension = tmp[tmp.length - 1];
      if (extension !== "txt" && extension !== "csv") {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeFileTypeNotSupported,
          message: `CalculateSMSPriceController - file type not supported - only txt & csv`,
        });
      }

      const data = await fsp.readFile(phoneNumbersFile.path, "utf8");
      const dataArray = data.split(",");

      if (dataArray.length === 0) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeFileInvalidStructure,
          message: `CalculateSMSPriceController - phonenumbers file invalid structure`,
        });
      }

      const phoneNumbersByCountry = {};

      for (let i = 0; i < dataArray.length; i++) {
        if (!dataArray[i] || typeof dataArray[i] !== "string") continue;
        if (dataArray[i].trim().length === 0) continue;

        const dataElement = dataArray[i]
          .replace(/,/g, "")
          .replace(/;/g, "")
          .replace(/:/g, "")
          .trim();

        const phoneNumber = `+${dataElement}`;

        const formattedPhoneNumber = Utils.formatPhoneNumber({ phoneNumber });

        if (
          !formattedPhoneNumber ||
          formattedPhoneNumber.startsWith("+234803200") ||
          formattedPhoneNumber.startsWith("+234810000")
        ) {
          console.log(
            `CalculateSMSPriceController, phonenumber ${dataElement} / ${formattedPhoneNumber}  invalid`,
          );
        } else {
          const countryCode = Utils.getCountryCodeFromPhoneNumber({
            phoneNumber: formattedPhoneNumber,
          });
          phoneNumbersByCountry[countryCode] = !phoneNumbersByCountry[countryCode]
            ? 1
            : phoneNumbersByCountry[countryCode] + 1;
        }
      }

      let total = 0;
      const phoneNumbersByCountryArray = Object.keys(phoneNumbersByCountry);
      for (let i = 0; i < phoneNumbersByCountryArray.length; i++) {
        const countryCode = phoneNumbersByCountryArray[i];
        const numCount = phoneNumbersByCountry[countryCode];
        const price = smsPricesByCountry[countryCode]?.price;
        let priceOfCountryNumbers = 0;
        if (price) {
          priceOfCountryNumbers = Math.round(price * 1000 * numCount) / 1000;
        } else {
          logger.error(
            `CalculateSMSPriceController, invalid SMS price for ${countryCode}: ` +
              JSON.stringify(price),
          );
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidSMSPrice,
            message:
              `CalculateSMSPriceController, invalid SMS price for ${countryCode}: ` +
              JSON.stringify(price),
            param: countries[countryCode].name,
          });
        }
        total = Utils.roundNumber(total + priceOfCountryNumbers, 2);
      }

      Base.successResponse(response, Const.responsecodeSucceed, { totalPrice: total });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "CalculateSMSPriceController",
        error,
      });
    }
  },
);

module.exports = router;
