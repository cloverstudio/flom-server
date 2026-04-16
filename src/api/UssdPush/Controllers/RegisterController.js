"use strict";

const router = require("express").Router();
const { logger, redis } = require("#infra");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { User } = require("#models");
const { sendMessage } = require("#logics");

/**
      * @api {get} /api/v2/registration-ussd Use USSD code and number
      * @apiName Get Dictionary
      * @apiGroup WebAPI
      * @apiReqHeader {String} code code
      * @apiQueryParam {String} subscriber subscriber
      * @apiDescription Use USSD code and number
      * @apiSuccessExample Success-Response:
 {}
 **/

router.get("/", async function (request, response) {
  try {
    response.type("application/xml");

    const { subscriber: phoneNumber, activationCode: code } = request.query;

    logger.info("RegisterController: " + JSON.stringify({ phoneNumber, code, req: request.query }));

    const userId = await getUserId(phoneNumber);

    const value = await redis.get(Const.redisKeyQrCode + code);
    if (value) {
      value.userId = userId;
      await redis.set(Const.redisKeyQrCode + code, value);

      response.send(
        `<page><div>Thank you for verifying your phone number. You can now enjoy Flom!</div></page>`,
      );
    } else {
      response.send(`<page><div>Time expired. Please try again.</div></page>`);
    }
  } catch (error) {
    logger.error("RegisterController", error);
    response.send(`<page><div>Something went wrong. Please try again.</div></page>`);
  }
});

async function getUserId(rawPhoneNumber) {
  let phoneNumber = rawPhoneNumber.startsWith("+") ? rawPhoneNumber : "+" + rawPhoneNumber;
  phoneNumber = Utils.formatPhoneNumber({ phoneNumber, countryCode: "NG" });

  if (!phoneNumber) {
    throw new Error("RegisterController, formatting phoneNumber failed: " + phoneNumber);
  }

  const userData = await User.findOne({ phoneNumber });

  const { rates } = await Utils.getConversionRates();

  let bankAccounts;
  if (phoneNumber.startsWith("+234")) {
    try {
      bankAccounts = await Utils.getAllBankAccountsWithMsisdn(phoneNumber);
    } catch (error) {
      logger.error("RegisterController, fetching bank accounts for NG user failed");
      bankAccounts = [];
    }
  }

  if (userData) {
    if (bankAccounts) {
      userData.bankAccounts = bankAccounts;
    }

    if (!userData.currency && userData.countryCode && rates) {
      userData.currency = Utils.getCurrencyFromCountryCode({
        countryCode: userData.countryCode,
        rates,
      });
    }

    await userData.save();

    return userData._id.toString();
  }
  // create new user
  const user = new User();

  // set initial user data
  user.name = `Flomer_${user._id.toString()}`;
  user.userName = `Flomer_${user._id.toString()}`;
  user.hasLoggedIn = Const.userShadowUser;
  user.organizationId = Const.organizationId;
  user.groups = [Const.groupId];
  user.created = Date.now();
  user.phoneNumber = phoneNumber;
  user.inAppUser = false;
  user.countryCode = Utils.getCountryCodeFromPhoneNumber({ phoneNumber });
  if (user.countryCode && rates) {
    user.currency = Utils.getCurrencyFromCountryCode({
      countryCode: user.countryCode,
      rates,
    });
  }
  user.followedBusinesses = [Config.flomSupportAgentId];

  let stringExists = false;
  const regexTerminalCode = /[^0-9]/g;

  do {
    const randomString = Utils.getRandomString(8).toLowerCase();

    const lnRegex = new RegExp(`^${randomString}$`, "i");
    const alreadyExists = await User.findOne({
      $or: [{ lightningUserName: lnRegex }, { userName: lnRegex }],
    }).lean();
    if (alreadyExists) {
      stringExists = true;
    } else if (!randomString.match(regexTerminalCode)) {
      stringExists = true;
    } else {
      user.lightningUserName = randomString;
      stringExists = false;
    }
  } while (stringExists);

  const newToken = Utils.getRandomString(Const.tokenLength);
  const now = Date.now();

  const tokenObj = {
    token: newToken,
    generateAt: now,
  };

  let tokenAry = [];
  tokenAry.push(tokenObj);

  user.token = tokenAry;
  user.status = 1;

  if (!phoneNumber.startsWith("+234") || !bankAccounts) {
    user.typeAcc = 2;

    await user.save();

    sendMsg(user);

    return user._id.toString();
  }

  user.typeAcc = 1;

  user.bankAccounts = bankAccounts;

  await user.save();

  sendMsg(user);

  // remove later - for dev only
  logger.info(
    `===============\n New user created via ussd!\n Phone number: ${phoneNumber}\n ===============`,
  );

  return user._id.toString();
}

async function sendMsg(receiverUser) {
  if (Config.flomSupportAgentId !== receiverUser._id.toString()) {
    return;
  }
  const senderUser = await User.findOne({ _id: Config.flomSupportAgentId }).lean();

  const chatId = Utils.chatIdByUser(senderUser, receiverUser);

  const messageParams = {
    roomID: chatId,
    userID: senderUser._id.toString(),
    type: Const.messageTypeText,
    message: Const.welcomeMessageText,
    plainTextMessage: true,
  };

  await sendMessage(messageParams);
}

module.exports = router;
