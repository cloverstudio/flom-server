"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { User, FlomMessage } = require("#models");
const { sendMessage } = require("#logics");

/*
      * @api {post} /api/v2/user/phoneNumber/validation Phone Number Validation
      * @apiName Phone Number Validation
      * @apiGroup WebAPI
      * @apiDescription Posting merchant msisdn in order to do Phone Number Validation
      *
      * @apiParam {String} phoneNumber phoneNumber
      * @apiParam {String} UUID UUID
      * @apiParam {String} pushToken pushToken
      * @apiParam {String} voipPushToken voipPushToken
      * @apiParam {String} activationCode activationCode
      * 
      * @apiSuccessExample Success-Response:
    {
        "code": 1,
        "time": 1548758953242,
        "data": {
            "merchantData": [
                {
                    "merchantCode": "20040488x",
                    "merchantName": "QRIOS NETWORKS LIMITED"
                },
                {
                    "merchantCode": "50040477",
                    "merchantName": "QRIOS NETWORKS LIMITED"
                }
            ]
        }
   
    }
         @apiSuccessExample No merchant code found:
        {
            "code": 4000610,
            "time": 1535963217064
        }
 
     */

router.post("/", async (request, response) => {
  try {
    let phoneNumber = request.body.phoneNumber;
    let UUID = request.body.UUID;
    let newPushToken = request.body.pushToken;
    let newVoipPushToken = request.body.voipPushToken;
    let activationCode = request.body.activationCode;
    let isWebClient = request.body.isWebClient || false;

    if (!phoneNumber) {
      return Base.successResponse(response, Const.responsecodeNoPhoneNumber);
    }

    if (!activationCode) {
      return Base.successResponse(response, Const.responsecodeNoActivationCode);
    }

    if (Const.flomAgentPhoneNumbers.includes(phoneNumber)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidPhoneNumber,
        type: Const.logTypeLogin,
        message: `PhoneNumberValidationController, ${phoneNumber} invalid phone number`,
      });
    }

    let user = await User.findOne({ phoneNumber: phoneNumber }).lean();

    if (!user) {
      return Base.successResponse(response, Const.responsecodeSigninUserNotFound);
    }

    if (user?.isDeleted.value) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserDeleted,
        message: "PhoneNumberValidationController, user deleted",
      });
    }

    if (user.activationCode !== activationCode) {
      console.log(
        user.activationCode,
        typeof user.activationCode,
        activationCode,
        typeof activationCode,
      );

      return Base.successResponse(response, Const.responsecodeSignupInvalidActivationCode);
    }

    const senderUser = await User.findOne({ _id: Config.flomSupportAgentId }).lean();

    await sendMsg(senderUser, user);

    const newToken = Utils.getRandomString(Const.tokenLength);
    const now = Utils.now();

    const tokenObj = {
      token: newToken,
      generateAt: now,
      isWebClient,
    };

    let tokenAry = !user.token
      ? []
      : isWebClient
      ? user.token.filter((t) => !t.isWebClient)
      : user.token.filter((t) => t.isWebClient);

    tokenAry.push(tokenObj);

    const tokenToSend = tokenObj.token.toString();

    if (UUID) {
      let uuidAry = [];
      let UUIDObj = {
        UUID: UUID,
        lastLogin: Utils.now(),
        blocked: false,
        lastToken: user.token,
        pushTokens: [],
      };

      if (newPushToken) UUIDObj.pushTokens.push(newPushToken);
      if (newVoipPushToken) UUIDObj.pushTokens.push(newVoipPushToken);

      uuidAry.push(UUIDObj);
      user.UUID = uuidAry;
    }

    user.token = tokenAry;
    user.pushToken = !newPushToken ? [] : [newPushToken];
    user.voipPushToken = !newVoipPushToken ? [] : [newVoipPushToken];
    user.status = 1;
    user.activationCode = null;
    user.hasLoggedIn = Const.userLoggedInAtLeastOnce;
    if (!user.firstLogin && user.lastLogin) {
      user.firstLogin = 1;
    } else if (!user.firstLogin) {
      user.firstLogin = Date.now();
    }
    user.lastLogin = Date.now();
    user.loginCount = !user.loginCount ? 1 : user.loginCount + 1;

    let dataToSend = {};
    dataToSend.userData = {
      userId: user._id,
      phoneNumber: user.phoneNumber,
      tkn: tokenToSend,
    };

    if (phoneNumber.startsWith("+234")) {
      user.onAnotherDevice = true;
    }

    dataToSend.supportUser = senderUser;

    /*
     * CASE 0 - User is fake merchant
     */

    if (Const.fakePhoneNumbers.indexOf(phoneNumber) > -1) {
      dataToSend.userData.typeAcc = 1;
      user.typeAcc = 1;

      dataToSend.merchantData = [Const.fakeBankAcc];

      user.bankAccounts = dataToSend.merchantData;
      user.isCreator = true;

      dataToSend.user = user;

      await User.findByIdAndUpdate(user._id.toString(), { $set: { ...user } });

      console.log("Config.cookieConfig ", Config.cookieConfig);

      Utils.setCookies(response, tokenToSend, user._id, request.headers.origin);
      // response.cookie("access-token", tokenToSend, Config.cookieConfig);
      // response.cookie("userId", user._id, Config.cookieConfig);

      return Base.successResponse(response, Const.responsecodeSucceed, dataToSend);
    }

    let merchantData = null;

    if (
      user.phoneNumber.startsWith("+234") &&
      (!user.bankAccounts || user.bankAccounts.length < 1)
    ) {
      try {
        merchantData = await Utils.getAllBankAccountsWithMsisdn(phoneNumber);
      } catch (error) {
        logger.error("PhoneNumberValidationController, fetching bank accounts for NG user failed");
        merchantData = [];
      }
      user.bankAccounts = merchantData;
    } else {
      merchantData = user.bankAccounts;
    }

    /*
     * CASE 1 - User is not registered and doesn't have
     *          merchant data - User is customer
     */

    if (!merchantData || merchantData.length === 0) {
      dataToSend.userData.typeAcc = 2;
      dataToSend.merchantData = [];
      user.typeAcc = 2;
      dataToSend.user = user;

      await User.findByIdAndUpdate(user._id.toString(), { $set: { ...user } });

      console.log("Config.cookieConfig ", Config.cookieConfig);

      Utils.setCookies(response, tokenToSend, user._id, request.headers.origin);
      // response.cookie("access-token", tokenToSend, Config.cookieConfig);
      // response.cookie("userId", user._id, Config.cookieConfig);
      return Base.successResponse(response, Const.responsecodeSucceed, dataToSend);
    }

    /*
     * CASE 2 - User is not registered and has
     *          merchant data - User is merchant
     */

    dataToSend.userData.typeAcc = 1;
    dataToSend.user = user;
    user.typeAcc = 1;
    user.isCreator = true;

    dataToSend.merchantData = merchantData;
    dataToSend.isCreator = true;

    await User.findByIdAndUpdate(user._id.toString(), { $set: { ...user } });

    console.log("Config.cookieConfig ", Config.cookieConfig);

    Utils.setCookies(response, tokenToSend, user._id, request.headers.origin);
    // response.cookie("access-token", tokenToSend, Config.cookieConfig);
    // response.cookie("userId", user._id, Config.cookieConfig);
    return Base.successResponse(response, Const.responsecodeSucceed, dataToSend);
  } catch (e) {
    return Base.errorResponse(
      response,
      Const.httpCodeServerError,
      "PhoneNumberValidationController",
      e,
    );
  }
});

async function sendMsg(senderUser, receiverUser) {
  if (!senderUser || !receiverUser) return;

  if (senderUser._id.toString() === receiverUser._id.toString()) {
    return logger.warn("PhoneNumberValidationController, same users");
  }

  const chatId = Utils.chatIdByUser(senderUser, receiverUser);

  const FatAiUser = await User.findOne({ _id: Const.FatAiObjectId }).lean();

  const chatIdFatAiIncluded = Utils.chatIdByUser(FatAiUser, receiverUser);

  const oldMessages = await FlomMessage.find({ roomID: chatId });

  const oldMessagesFatAi = await FlomMessage.find({ roomID: chatIdFatAiIncluded });

  if (!oldMessages || !oldMessages.length) {
    const messageParams = {
      roomID: chatId,
      userID: senderUser._id.toString(),
      type: Const.messageTypeText,
      message: Const.welcomeMessageText,
      plainTextMessage: true,
    };

    await sendMessage(messageParams);
  }

  if (
    (!oldMessagesFatAi || !oldMessagesFatAi.length) &&
    (Utils.now() - receiverUser.dateOfBirth) / Const.milisInYear >= 16
  ) {
    const messageParamsFatAi = {
      roomID: chatIdFatAiIncluded,
      userID: FatAiUser._id.toString(),
      type: Const.messageTypeText,
      message: Const.welcomeMessageChatGpt,
      plainTextMessage: true,
      isRecursiveCall: true, //this will prevent call to chatgpt api
    };

    await sendMessage(messageParamsFatAi);
  }
}

module.exports = router;
