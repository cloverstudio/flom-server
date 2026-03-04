"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { User, Bank } = require("#models");

/**
 * @api {patch} /api/v2/user/bank-accounts Update users bank account flom_v1
 * @apiVersion 2.0.10
 * @apiName  Update users bank account flom_v1
 * @apiGroup WebAPI User
 * @apiDescription  API which is called to update user's bank account. One of either bank code or bank account number must be provided.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiParam {String} merchantCode         Merchant code of bank account
 * @apiParam {String} bankId               Id of account's bank
 * @apiParam {String} bankAccountNumber    Bank account number
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1677669907768,
 *     "data": {
 *         "updatedBankAccounts": [
 *             {
 *                 "merchantCode": "40200168",
 *                 "name": "SampleAcc",
 *                 "accountNumber": "987654321",
 *                 "code": "000",
 *                 "selected": true
 *             }
 *         ]
 *     }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 400260  No merchant code
 * @apiError (Errors) 400261  Invalid merchant code - account not found
 * @apiError (Errors) 443775  Bank not found
 * @apiError (Errors) 443800  Missing parameter (bankId or bankAccountNumber)
 * @apiError (Errors) 4000007 Token invalid
 */

router.patch("/", auth({ allowUser: true }), async (request, response) => {
  try {
    const { merchantCode, bankId, bankAccountNumber } = request.body;
    const user = request.user;

    if (!merchantCode) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoMerchantCode,
        message: `UpdateUsersBankAccountController - merchant code missing`,
      });
    }
    if (!bankId) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeMissingParameter,
        message: `UpdateUsersBankAccountController - missing bankId`,
        param: "bankId",
      });
    }
    if (!bankAccountNumber) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeMissingParameter,
        message: `UpdateUsersBankAccountController - missing bank account number`,
        param: "bankAccountNumber",
      });
    }

    const bank = await Bank.findById(bankId).lean();
    if (!bank) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeBankDoesNotExist,
        message: `UpdateUsersBankAccountController - bank not found`,
        param: "bankAccountNumber",
      });
    }

    const bankAccounts = user.bankAccounts;

    let foundAccount = false;
    bankAccounts.forEach((account) => {
      if (account.merchantCode === merchantCode) {
        foundAccount = true;
        account.bankName = bank.name;
        account.code = bank.code;
        account.accountNumber = bankAccountNumber;
      }
    });

    if (!foundAccount) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidMerchantCode,
        message: `UpdateUsersBankAccountController - invalid merchant code, account not found`,
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      user._id.toString(),
      { bankAccounts, modified: Date.now() },
      { new: true, lean: true },
    );

    Base.successResponse(response, Const.responsecodeSucceed, {
      updatedBankAccounts: updatedUser.bankAccounts,
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "UpdateUsersBankAccountController",
      error,
    });
  }
});

module.exports = router;
