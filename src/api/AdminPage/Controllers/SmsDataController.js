"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { SmsData } = require("#models");

/**
 * @api {method} /api/v2/admin-page/sms-data/:id  Get SMS data entry flom_v1
 * @apiVersion 2.0.16
 * @apiName  Get SMS data entry flom_v1
 * @apiGroup WebAPI Admin page - SMS Data
 * @apiDescription  Api for getting an SMS data entry. If no entry found, empty object is returned.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1700584750540,
 *     "data": {
 *         "smsData": {
 *             "_id": "64f7df3b453706fcb952c29f",
 *             "phoneNumber": "+2348153353131",
 *             "countryCode": "NG",
 *             "service": "twilio",
 *             "smsType": "test",
 *             "price": 1982,
 *             "apiRequest": {
 *                 "body": "Localtest",
 *                 "from": "+14696064229",
 *                 "to": "+2348153353131",
 *                 "statusCallback": "https://v2.flom.dev/api/v2/payment/cb/test"
 *             },
 *             "status": "internal_error",
 *             "failureReason": {
 *                 "message": "Cannot convert undefined or null to object"
 *             },
 *             "internalError": "Cannot convert undefined or null to object",
 *             "created": 1693966139027
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

router.get(
  "/:id",
  auth({ allowAdmin: true, role: Const.Role.ADMIN }),
  async function (request, response) {
    try {
      const id = request.params.id;

      const smsData = await SmsData.findById(id).lean();

      if (smsData.price) {
        smsData.price = +(smsData.price / Const.smsDataPriceFactor).toFixed(6);
      }

      const responseData = { smsData: smsData ?? {} };
      Base.successResponse(response, Const.responsecodeSucceed, responseData);
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "SmsDataController, GET",
        error,
      });
    }
  },
);

/**
 * @api {get} /api/v2/admin-page/sms-data  Get SMS data list flom_v1
 * @apiVersion 2.0.16
 * @apiName  Get SMS data list flom_v1
 * @apiGroup WebAPI Admin page - SMS Data
 * @apiDescription  Api for getting a list of SMS data entries. Entries are sorted by timestamp, from latest to oldest.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiParam (Query string) {String} [phoneNumber]     Sample   Receiver's phone number
 * @apiParam (Query string) {String} [service]         Sample   Service used to send the SMS (qrios, twilio, sinch)
 * @apiParam (Query string) {String} [countryCode]     Sample   Receiver's country code
 * @apiParam (Query string) {String} [smsType]         Sample   Type of SMS (invite, admin (bulk sms admin api), login, admin_login, promo, test)
 * @apiParam (Query string) {String} [status]          Sample   Status of SMS (sent, failed, pending, request_error, internal_error)
 * @apiParam (Query string) {String} [dateLowerLimit]  Sample   Lower limit for date of SMS (YYYY-MM-DD format)
 * @apiParam (Query string) {String} [dateUpperLimit]  Sample   Upper limit for date of SMS (YYYY-MM-DD format)
 * @apiParam (Query string) {String} [page]            Sample   Page
 * @apiParam (Query string) {String} [size]            Sample   Page size
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1700583818517,
 *     "data": {
 *         "smsData": [
 *             {
 *                 "_id": "6512aa48df0ceba4d6d52fdd",
 *                 "phoneNumber": "+12252542523",
 *                 "message": "test",
 *                 "countryCode": "US",
 *                 "isBatch": false,
 *                 "service": "sinch",
 *                 "smsType": "login",
 *                 "smsTry": 1,
 *                 "price": 78,
 *                 "identifier": "01HB8EJAB2EKP9FZAHZXZBB8D3",
 *                 "apiRequest": {
 *                 },
 *                 "apiResponse": {
 *                 },
 *                 "status": "sent",
 *                 "created": 1695722056040,
 *                 "apiCallback": {
 *                 }
 *             },
 *             {
 *                 "_id": "64f9a5e8eee2e4d72dac9fc1",
 *                 "phoneNumber": "+385958710207",
 *                 "message": "Wazzaaaaaaaaaapppppppp",
 *                 "countryCode": "HR",
 *                 "isBatch": false,
 *                 "service": "twilio",
 *                 "smsType": "test",
 *                 "smsTry": 1,
 *                 "price": 768,
 *                 "identifier": "SMbdfac3f7205192200d9e89bf698a465e",
 *                 "apiRequest": {
 *                 },
 *                 "apiResponse": {
 *                 },
 *                 "status": "sent",
 *                 "created": 1694082536174,
 *                 "apiCallback": {
 *                 }
 *             },
 *             {
 *                 "_id": "64f7e30936f111d83438ac34",
 *                 "phoneNumber": "+27665773560",
 *                 "countryCode": "ZA",
 *                 "service": "africas-talking",
 *                 "smsType": "test",
 *                 "smsTry": 1,
 *                 "price": 200,
 *                 "africasTalkingMessageId": "ATXid_f05a8c011230f4da4d28da12df08ee51",
 *                 "apiRequest": {
 *                 },
 *                 "apiResponse": {
 *                 },
 *                 "status": "pending",
 *                 "failureReason": "Sent",
 *                 "created": 1693967113129
 *             },
 *             {
 *                 "_id": "64f7e1b504e8fe8de57c0c42",
 *                 "phoneNumber": "+2348153353131",
 *                 "countryCode": "NG",
 *                 "service": "qrios",
 *                 "smsType": "test",
 *                 "smsTry": 1,
 *                 "price": 200,
 *                 "qriosOperationId": "SMS_2155043631",
 *                 "apiRequest": {
 *                 },
 *                 "apiResponse": {
 *                 },
 *                 "status": "sent",
 *                 "created": 1693966773958
 *             },
 *         ],
 *         "paginationData": {
 *             "total": 22,
 *             "hasNext": true,
 *             "page": 1,
 *             "pageSize": 20
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

router.get(
  "/",
  //auth({ allowAdmin: true, role: Const.Role.ADMIN }),
  async function (request, response) {
    try {
      const {
        phoneNumber,
        service,
        countryCode,
        smsType,
        status,
        dateLowerLimit,
        dateUpperLimit,
        page: p,
        size: s,
      } = request.query;

      const query = {};
      const timeQuery = {};
      const page = !p ? 1 : +p;
      const size = !s ? Const.newPagingRows : +s;
      if (phoneNumber) query.phoneNumber = phoneNumber;
      if (service) query.service = service;
      if (countryCode) query.countryCode = countryCode;
      if (smsType) query.smsType = smsType;
      if (status) query.status = status;
      if (dateLowerLimit) {
        const utcDate = new Date(dateLowerLimit).getTime();
        timeQuery.$gt = utcDate;
      }
      if (dateUpperLimit) {
        const utcDate = new Date(dateUpperLimit).getTime();
        timeQuery.$lt = utcDate;
      }
      if (Object.keys(timeQuery).length > 0) query.created = timeQuery;

      const smsData = await SmsData.find(query)
        .sort({ created: -1 })
        .skip((page - 1) * size)
        .limit(size)
        .lean();
      const total = await SmsData.countDocuments(query);

      const hasNext = page * size < total;

      smsData.forEach((data) => {
        if (data.price) {
          data.price = +(data.price / Const.smsDataPriceFactor).toFixed(6);
        }
      });

      const responseData = {
        smsData,
        paginationData: { total, hasNext, page, pageSize: size },
      };
      Base.successResponse(response, Const.responsecodeSucceed, responseData);
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "SmsDataController, GET list",
        error,
      });
    }
  },
);

module.exports = router;
