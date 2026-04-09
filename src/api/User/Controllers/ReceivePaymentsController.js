"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { User } = require("#models");

/**
      * @api {get} /api/v2/user/receive-payments Enable receive payments for user
      * @apiName Enable receive payments for user
      * @apiGroup WebAPI
      * @apiDescription Enable receive payments for user of request user
      * @apiHeader {String} access-token Users unique access-token.
			* 
			*
      * @apiSuccessExample Success-Response:
      {
          code: 1,
          time: 1455627869209,
          data: {
              username: "username"
          }
      }
      * @apiFailureExample Failure-Response:
      {
          code: 1,
          time: 1455627869209,
          data: {
              invalidChars: [" ", "&"]
          }
      }
     
    **/

router.get("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const user = request.user;
    const phoneNumber = user.phoneNumber;

    user.bankAccounts = await Utils.getAllBankAccountsWithMsisdn(phoneNumber);

    if (user.bankAccounts.length > 0) {
      await User.updateOne({ _id: user._id }, user);

      return Base.successResponse(response, Const.responsecodeSucceed, { receivePayments: true });
    }
  } catch (e) {
    Base.errorResponse(response, Const.httpCodeServerError, "ReceivePaymentsController GET", e);
  }
});

/**
      * @api {post} /api/v2/user/receive-payments/ Enable receive payments for user
      * @apiName Enable receive payments for user
      * @apiGroup WebAPI
      * @apiDescription Enable receive payments for user of request user
      * @apiHeader {String} access-token Users unique access-token.
			* 
      * @apiParam {String} merchantDOB merchantDOB
      * @apiParam {String} accountNumber accountNumber
			*
      * @apiSuccessExample Success-Response:
      {
          code: 1,
          time: 1455627869209,
          data: {
              username: "username"
          }
      }
      * @apiFailureExample Failure-Response:
      {
          code: 1,
          time: 1455627869209,
          data: {
              invalidChars: [" ", "&"]
          }
      }
     
    **/

router.post("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const { merchantDOB, accountNumber } = request.body;

    const user = request.user;
    const phoneNumber = user.phoneNumber;

    user.bankAccounts = await Utils.getAllBankAccountsWithMsisdn(phoneNumber);

    if (user.bankAccounts.length > 0) {
      await User.updateOne({ _id: user._id }, user);

      return Base.successResponse(response, Const.responsecodeSucceed, { receivePayments: true });
    }
  } catch (e) {
    Base.errorResponse(response, Const.httpCodeServerError, "ReceivePaymentsController POST", e);
  }
});

module.exports = router;
