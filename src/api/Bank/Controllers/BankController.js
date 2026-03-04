"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { Bank } = require("#models");

/**
 * @api {get} /api/v2/bank/search Search banks flom_v1
 * @apiVersion 2.0.12
 * @apiName  Search banks flom_v1
 * @apiGroup WebAPI Bank
 * @apiDescription  API which is called to search for banks by their name. If no search term is given behaves like a bank list API.
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiParam (Query string) {string} [term]         Search term (case insensitive)
 * @apiParam (Query string) {string} [countryCode]  Country code of banks
 * @apiParam (Query string) {string} [page]         Page number (default: 1)
 * @apiParam (Query string) {string} [size]         Number of items on one page (default: 20)
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1674130965377,
 *     "data": {
 *         "banks": [
 *             {
 *                 "_id": "63c90830ebc3e64c72773047",
 *                 "countryCode": "AD",
 *                 "name": "RESULT INTERNACIONAL SA",
 *                 "iban": "AD1200012030200359100100",
 *                 "code": "0001",
 *                 "accountNumber": "200359100100",
 *                 "routingNumber": "",
 *                 "created": 1674119206411,
 *                 "modified": 1674119206411
 *             },
 *             {
 *                 "_id": "63c90830ebc3e64c727733f3",
 *                 "countryCode": "US",
 *                 "name": "SAFRA NATIONAL BANK OF NEW YORK",
 *                 "iban": "",
 *                 "code": "",
 *                 "accountNumber": "",
 *                 "routingNumber": "026003023",
 *                 "created": 1674119206412,
 *                 "modified": 1674119206412
 *             },
 *             {
 *                 "_id": "63c90830ebc3e64c7277343f",
 *                 "countryCode": "US",
 *                 "name": "SAKS FIFTH AVENUE EFCU",
 *                 "iban": "",
 *                 "code": "",
 *                 "accountNumber": "",
 *                 "routingNumber": "026072931",
 *                 "created": 1674119206412,
 *                 "modified": 1674119206412
 *             },
 *         ],
 *         "pagination": {
 *             "page": "2",
 *             "size": 100,
 *             "total": 103,
 *             "hasNext": false
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

router.get("/search", auth({ allowUser: true }), async function (request, response) {
  try {
    const searchTerm = request.query.term;
    const countryCode = request.query.countryCode;
    const page = +request.query.page || 1;
    const size = +request.query.size || 20;

    const query = {};

    if (searchTerm) {
      const regex = new RegExp(searchTerm, "i");
      query.name = regex;
    }
    if (countryCode) query.countryCode = countryCode;

    const total = await Bank.countDocuments(query);

    const banks = await Bank.find(query)
      .sort({ name: 1 })
      .skip((page - 1) * size)
      .limit(size)
      .lean();

    Base.successResponse(response, Const.responsecodeSucceed, {
      banks,
      pagination: {
        page,
        size,
        total,
        hasNext: page * size < total,
      },
    });
  } catch (error) {
    return Base.newErrorResponse({
      response,
      code: Const.httpCodeServerError,
      message: "BankController, search",
      error,
    });
  }
});

/**
 * @api {get} /api/v2/bank/:id Get bank flom_v1
 * @apiVersion 2.0.12
 * @apiName  Get bank flom_v1
 * @apiGroup WebAPI Bank
 * @apiDescription  API which is called to get bank info.
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1674131547711,
 *     "data": {
 *         "bank": {
 *             "_id": "63c90830ebc3e64c72773049",
 *             "countryCode": "AE",
 *             "name": "ABN AMRO BANK N.V. UNITED ARAB EMIRATES BRANCH",
 *             "iban": "AE070331234567890123456",
 *             "code": "033",
 *             "accountNumber": "1234567890123456",
 *             "routingNumber": "",
 *             "created": 1674119206411,
 *             "modified": 1674119206411
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

router.get("/:id", auth({ allowUser: true }), async function (request, response) {
  try {
    const bankId = request.params.id;

    const bank = await Bank.findById(bankId).lean();

    Base.successResponse(response, Const.responsecodeSucceed, { bank: !bank ? {} : bank });
  } catch (error) {
    return Base.newErrorResponse({
      response,
      code: Const.httpCodeServerError,
      message: "BankController, get bank",
      error,
    });
  }
});

/**
   * @api {get} /api/v2/bank Get bank list flom_v1
   * @apiVersion 2.0.12
   * @apiName  Get bank list flom_v1
   * @apiGroup WebAPI Bank
   * @apiDescription  API which is called to get a list of banks.
   *
   * @apiHeader {String} access-token Users unique access token.
   *
   * @apiParam (Query string) {string} [countryCode]  Country code of banks
   * @apiParam (Query string) {string} [page]         Page number (default: 1)
   * @apiParam (Query string) {string} [size]         Number of items on one page (default: 10)
   *
   * @apiSuccessExample Success Response
   * {
   *     "code": 1,
   *     "time": 1674130965377,
   *     "data": {
   *         "banks": [
   *             {
   *                 "_id": "63c90830ebc3e64c72773047",
   *                 "countryCode": "AD",
   *                 "name": "RESULT INTERNACIONAL SA",
   *                 "iban": "AD1200012030200359100100",
   *                 "code": "0001",
   *                 "accountNumber": "200359100100",
   *                 "routingNumber": "",
   *                 "created": 1674119206411,
   *                 "modified": 1674119206411,
   *                 "logoUrl": "https://v1.flom.app/api/v2/payment-methods/get-logo/1.png"
   *             },
   *             {
   *                 "_id": "63c90830ebc3e64c727733f3",
   *                 "countryCode": "US",
   *                 "name": "SAFRA NATIONAL BANK OF NEW YORK",
   *                 "iban": "",
   *                 "code": "",
   *                 "accountNumber": "",
   *                 "routingNumber": "026003023",
   *                 "created": 1674119206412,
   *                 "modified": 1674119206412,
   *                 "logoUrl": "https://v1.flom.app/api/v2/payment-methods/get-logo/1.png"
   *             },
   *             {
   *                 "_id": "63c90830ebc3e64c7277343f",
   *                 "countryCode": "US",
   *                 "name": "SAKS FIFTH AVENUE EFCU",
   *                 "iban": "",
   *                 "code": "",
   *                 "accountNumber": "",
   *                 "routingNumber": "026072931",
   *                 "created": 1674119206412,
   *                 "modified": 1674119206412,
                     "logoUrl": "https://v1.flom.app/api/v2/payment-methods/get-logo/1.png"
   *             },
   *         ],
   *         "pagination": {
   *             "page": "2",
   *             "size": 100,
   *             "total": 103,
   *             "hasNext": false
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

router.get("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const page = +request.query.page || 1;
    const size = +request.query.size || Const.newPagingRows;
    const countryCode = request.query.countryCode;

    const query = {};
    if (countryCode) query.countryCode = countryCode;

    const total = await Bank.countDocuments(query);

    let banks = await Bank.find(query)
      .sort({ name: 1 })
      .skip((page - 1) * size)
      .limit(size)
      .lean();

    Base.successResponse(response, Const.responsecodeSucceed, {
      banks,
      pagination: {
        page,
        size,
        total,
        hasNext: page * size < total,
      },
    });
  } catch (error) {
    return Base.newErrorResponse({
      response,
      code: Const.httpCodeServerError,
      message: "BankController, get bank list",
      error,
    });
  }
});

module.exports = router;
