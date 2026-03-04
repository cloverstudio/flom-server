"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { User, Bank } = require("#models");

/**
 * @api {get} /api/v2/user/bank-account/list Get users bank accounts flom_v1
 * @apiVersion 2.0.19
 * @apiName  Get users bank accounts flom_v1
 * @apiGroup WebAPI User - Bank account
 * @apiDescription  API to get users bank accounts.
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1711614739028,
 *     "data": {
 *         "bankAccounts": [
 *             {
 *                 "_id": "66052b12b168af46380e600c",
 *                 "bankId": "63d40df834551f8bbdb86335",
 *                 "bankCode": "011",
 *                 "accountNumber": "747238929029838",
 *                 "title": "Test1",
 *                 "ownerName": "Petar B",
 *                 "logoUrl": "http://lv1.flom.dev:3000/api/v2/payment-methods/get-logo/visa.png"
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
 * @apiError (Errors) 4000007 Token invalid
 */

router.get("/list", auth({ allowUser: true }), async function (request, response) {
  try {
    const {
      user: { nigerianBankAccounts = [] },
    } = request;

    /*nigerianBankAccounts = nigerianBankAccounts.map((bank) => {
          if (bank.logoFileName?.length > 0) {
            bank.logoUrl = `${Config.webClientUrl}/api/v2/payment-methods/get-logo/${bank.logoFileName}`;
          } else {
            bank.logoUrl = `${Config.webClientUrl}/api/v2/payment-methods/get-logo/payment-1.png`;
          }

          delete bank.logoFileName;

          return bank;
        });*/

    const responseData = { bankAccounts: nigerianBankAccounts };
    Base.successResponse(response, Const.responsecodeSucceed, responseData);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "UsersBankAccountsController, GET list",
      error,
    });
  }
});

/**
 * @api {post} /api/v2/user/bank-account Add bank account to user flom_v1
 * @apiVersion 2.0.19
 * @apiName  Add bank account to user flom_v1
 * @apiGroup WebAPI User - Bank account
 * @apiDescription  API to add bank account to user.
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiParam {String}  bankId         Id of bank for account to be added
 * @apiParam {String}  accountNumber  Account number
 * @apiParam {String}  title          Title of account
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1711615038087,
 *     "data": {
 *         "bankAccount": {
 *             "_id": "66052c3e94e1242a50806362",
 *             "bankId": "63d40df834551f8bbdb86335",
 *             "bankCode": "011",
 *             "accountNumber": "74723892249838",
 *             "title": "Test2",
 *             "ownerName": "Petar B"
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
 * @apiError (Errors) 443880 Invalid bank id
 * @apiError (Errors) 443881 Invalid account number
 * @apiError (Errors) 443882 Invalid account title
 * @apiError (Errors) 443883 Account already exists
 * @apiError (Errors) 443884 Account title already exists
 * @apiError (Errors) 443885 Account validation failed
 * @apiError (Errors) 443775 Bank not found
 * @apiError (Errors) 4000007 Token invalid
 */

router.post("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const { nigerianBankAccounts = [] } = user;
    const { bankId, accountNumber, title } = request.body;

    if (!bankId || !Utils.isValidObjectId(bankId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidBankId,
        message: "UsersBankAccountsController, POST - invalid bank id",
      });
    }

    if (
      !accountNumber ||
      typeof accountNumber !== "string" ||
      !isValidAccountNumber(accountNumber)
    ) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidAccountNumber,
        message: "UsersBankAccountsController, POST - invalid account number",
      });
    }

    if (!title || typeof title !== "string") {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidAccountTitle,
        message: "UsersBankAccountsController, POST - invalid account title",
      });
    }

    const bank = await Bank.findById(bankId).lean();

    if (!bank) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeBankDoesNotExist,
        message: "UsersBankAccountsController, POST - bank not found",
      });
    }

    let titleExists = false,
      accExists = false;
    for (const account of nigerianBankAccounts) {
      if (account.title === title) titleExists = true;
      if (account.bankId === bankId && account.accountNumber === accountNumber) accExists = true;
    }

    if (accExists) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeBankAccountAlreadyExists,
        message: "UsersBankAccountsController, POST - account already exists",
      });
    }

    if (titleExists) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeAccountTitleAlreadyExists,
        message: "UsersBankAccountsController, POST - account title already exists",
      });
    }

    const { errorCode, ownerName } = await validateNigerianBankAccount({
      accountNumber,
      bankCode: bank.code,
      phoneNumber: user.phoneNumber,
      userName: user.userName,
    });

    if (errorCode) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeBankAccountValidationFailed,
        message: "UsersBankAccountsController, POST - account failed validation",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      user._id.toString(),
      {
        $push: {
          nigerianBankAccounts: {
            bankId,
            bankCode: bank.code,
            bankName: bank.name,
            accountNumber,
            title,
            ownerName,
            logoFileName: bank.logoFileName,
          },
        },
      },
      { new: true, lean: true },
    );

    const bankAccount = updatedUser.nigerianBankAccounts.find(
      (element) => element.bankId === bankId && element.accountNumber === accountNumber,
    );

    const responseData = { bankAccount };
    Base.successResponse(response, Const.responsecodeSucceed, responseData);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "UsersBankAccountsController, POST",
      error,
    });
  }
});

/**
 * @api {patch} /api/v2/user/bank-account/:accountId Update users bank account flom_v1
 * @apiVersion 2.0.19
 * @apiName  Update users bank account flom_v1
 * @apiGroup WebAPI User - Bank account
 * @apiDescription  API to update users bank account.
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiParam {String}  title          Title of account
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1711615038087,
 *     "data": {
 *         "bankAccount": {
 *             "_id": "66052c3e94e1242a50806362",
 *             "bankId": "63d40df834551f8bbdb86335",
 *             "bankCode": "011",
 *             "accountNumber": "74723892249838",
 *             "title": "Test333",
 *             "ownerName": "Petar B"
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
 * @apiError (Errors) 443882 Invalid account title
 * @apiError (Errors) 443884 Account title already exists
 * @apiError (Errors) 443886 Account not found
 * @apiError (Errors) 4000007 Token invalid
 */

router.patch("/:accountId", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const { nigerianBankAccounts = [] } = user;
    const { accountId } = request.params;
    const { title } = request.body;

    if (!title || typeof title !== "string") {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidAccountTitle,
        message: "UsersBankAccountsController, PATCH - invalid account title",
      });
    }

    let account,
      titleExists = false;

    for (const acc of nigerianBankAccounts) {
      if (acc._id.toString() === accountId) account = acc;
      if (acc.title === title) titleExists = true;
    }

    if (!account) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeBankAccountNotFound,
        message: "UsersBankAccountsController, PATCH - account not found",
      });
    }

    if (titleExists) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeAccountTitleAlreadyExists,
        message: "UsersBankAccountsController, PATCH - account title already exists",
      });
    }

    account.title = title;

    const updatedUser = await User.findByIdAndUpdate(
      user._id.toString(),
      { nigerianBankAccounts },
      { new: true, lean: true },
    );

    const responseData = { bankAccount: account };
    Base.successResponse(response, Const.responsecodeSucceed, responseData);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "UsersBankAccountsController, PATCH",
      error,
    });
  }
});

/**
 * @api {delete} /api/v2/user/bank-account/:accountId Delete users bank account flom_v1
 * @apiVersion 2.0.19
 * @apiName  Delete users bank account flom_v1
 * @apiGroup WebAPI User - Bank account
 * @apiDescription  API to delete users bank account.
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1711614739028,
 *     "data": {
 *         "bankAccounts": [
 *             {
 *                 "_id": "66052b12b168af46380e600c",
 *                 "bankId": "63d40df834551f8bbdb86335",
 *                 "bankCode": "011",
 *                 "accountNumber": "747238929029838",
 *                 "title": "Test1",
 *                 "ownerName": "Petar B"
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
 * @apiError (Errors) 443886 Account not found
 * @apiError (Errors) 4000007 Token invalid
 */

router.delete("/:accountId", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const { nigerianBankAccounts = [] } = user;
    const { accountId } = request.params;

    let account;

    for (const acc of nigerianBankAccounts) {
      if (acc._id.toString() === accountId) account = acc;
    }

    if (!account) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeBankAccountNotFound,
        message: "UsersBankAccountsController, DELETE - account not found",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      user._id.toString(),
      {
        $pull: {
          nigerianBankAccounts: {
            title: account.title,
            accountNumber: account.accountNumber,
            bankCode: account.bankCode,
          },
        },
      },
      { new: true, lean: true },
    );

    const responseData = { bankAccounts: updatedUser.nigerianBankAccounts };
    Base.successResponse(response, Const.responsecodeSucceed, responseData);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "UsersBankAccountsController, DELETE",
      error,
    });
  }
});

function isValidAccountNumber(accountNumber) {
  const allowed = "0123456789";

  for (const char of accountNumber) {
    if (!allowed.includes(char)) return false;
  }

  return true;
}

async function validateNigerianBankAccount({ accountNumber, bankCode, phoneNumber, userName }) {
  if (Config.environment !== "production") {
    return { ownerName: userName };
  }

  const errorObj = { errorCode: true };

  let ownerName = "";

  try {
    const data = await Utils.sendRequest({
      method: "POST",
      headers: Config.qriosHeaders,
      url: `${process.env.QRIOS_BASE_URL}/payout/verifyAccountDetails`,
      body: { bankAccountNumber: accountNumber, bankCode },
    });

    if (data?.status !== "OK") {
      logger.error(
        "Validate Nigerian bank account, account details error: " + JSON.stringify(data),
      );
      return errorObj;
    }

    ownerName = data.accountName;
  } catch (error) {
    logger.error("Validate Nigerian bank account, account details", error);
    return errorObj;
  }

  try {
    const data = await Utils.sendRequest({
      method: "POST",
      headers: Config.qriosHeaders,
      url: `${process.env.QRIOS_BASE_URL}/customer/validate`,
      body: {
        operationId: `Flom-CustomerQuery-${Date.now()}`,
        customerQuery: {
          name: ownerName,
          msisdn: phoneNumber,
        },
      },
    });

    if (data?.result && data.result === "MATCH") {
      logger.info(`Validate Nigerian bank account, match! ${JSON.stringify(data)}`);
      return { ownerName };
    }

    logger.error(
      `Validate Nigerian bank account, validate customer error - result: ${data.result}, message: ${data.message}`,
    );
    return errorObj;
  } catch (error) {
    logger.error("Validate Nigerian bank account, validate customer", error);
    return errorObj;
  }
}

module.exports = router;
