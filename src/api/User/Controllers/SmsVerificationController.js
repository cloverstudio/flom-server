"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { User, AccessRecord, BannedNumber, CountryWideBan, TemporaryBan } = require("#models");
const { createNewUser } = require("#logics");

/*
      * @api {post} /api/v2/user/presendphonenumber/ Verify Phone Number AP
      * @apiName Vertify Phone Number AP
      * @apiGroup WebAPI
      * @apiDescription Sending vertification code to new user
      *   
      * @apiParam {String} phoneNumber phoneNumber
      * @apiParam {String} reCaptcha   reCaptcha
      * @apiParam {String} ref         ref
      * @apiParam {String} try         try
      * 
      * @apiSuccessExample Success-Response:
    {
        "code": 1,
        "time": 1536574245001,
        "data": {}
    }

    */

router.post("/", async (request, response) => {
  try {
    const { phoneNumber: rawPhoneNumber, ref, isWebClient, reCaptcha } = request.body;
    const IP = request.headers["x-forwarded-for"] || request.connection.remoteAddress;
    const UUID = request.headers["UUID"] || request.headers["uuid"];

    validatePhoneNumber(rawPhoneNumber.trim());

    const phoneNumber = Utils.formatPhoneNumber({ phoneNumber: rawPhoneNumber.trim() });
    if (!phoneNumber || Const.flomAgentPhoneNumbers.includes(phoneNumber)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidPhoneNumber,
        type: Const.logTypeLogin,
        message: `SMSVerificationController, ${rawPhoneNumber} invalid phone number`,
      });
    }

    const bannedNumber = await BannedNumber.findOne({ phoneNumber }).lean();
    if (bannedNumber) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodePhoneNumberIsBlocked,
        type: Const.logTypeLogin,
        message: `SMSVerificationController, ${phoneNumber} banned phone number`,
      });
    }

    const temporaryBan = await TemporaryBan.findOne({ phoneNumber }).lean();
    if (
      temporaryBan &&
      Date.now() < temporaryBan.created + temporaryBan.duration &&
      Config.environment === "production"
    ) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodePhoneNumberIsTemporarilyBanned,
        type: Const.logTypeLogin,
        message: `SMSVerificationController, ${phoneNumber} temporarily banned phone number`,
        param:
          temporaryBan.duration === 1000 * 60 * 30
            ? Math.ceil((temporaryBan.duration - (Date.now() - temporaryBan.created)) / (1000 * 60))
            : Math.ceil(
                (temporaryBan.duration - (Date.now() - temporaryBan.created)) / (1000 * 60 * 60),
              ),
        param2: temporaryBan.duration === 1000 * 60 * 30 ? "minutes" : "hours",
      });
    }

    const phoneCountryCode = Utils.getCountryCodeFromPhoneNumber({ phoneNumber });

    if (!Const.developerPhoneNumbers.includes(phoneNumber)) {
      await AccessRecord.create({
        phoneNumber,
        timestamp: new Date().toISOString(),
        countryCode: phoneCountryCode,
        IP,
        UUID,
        loginType: "sms",
      });
    }

    // user flood check
    const userFloodRes = await detectUserFlooding({ phoneNumber });
    if (userFloodRes.flood && Config.environment === "production") {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodePhoneNumberIsTemporarilyBanned,
        type: Const.logTypeLogin,
        message: `SMSVerificationController, ${phoneNumber} temporarily banned phone number`,
        param: userFloodRes.duration,
        param2: userFloodRes.unitOfTime,
      });
    }

    // IP Check
    logger.info(`SmsVerificationController - ${phoneNumber} - IP: ${IP}`);

    const ipAddressObj = await Utils.getCountryFromIpAddress({ IP });
    if (!ipAddressObj) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeIPCheckError,
        type: Const.logTypeLogin,
        message: `SMSVerificationController, IP check failed`,
      });
    }

    if (ipAddressObj?.isVPN && Config.environment === "production") {
      const existingUser = await User.findOne({ phoneNumber }).lean();

      if (
        !(
          existingUser &&
          [3, 6].includes(existingUser.merchantApplicationStatus ?? null) &&
          existingUser.phoneNumberStatus === Const.phoneNumberValid
        )
      ) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeVPNDetected,
          type: Const.logTypeLogin,
          message: `SMSVerificationController, VPN detected`,
        });
      }
    }

    const hash = request.body.token;

    const attempt = request.body.try ? +request.body.try : 1;
    console.log("attempt", { attempt });

    const deviceType = isWebClient === true ? "web" : request.headers["device-type"];
    if (!deviceType && !Const.fakeTestingPhoneNumbers.includes(phoneNumber)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidDeviceType,
        type: Const.logTypeLogin,
        message: `SMSVerificationController, ${phoneNumber} has invalid device type: ` + deviceType,
      });
    }

    if (!isWebClient && !Const.fakeTestingPhoneNumbers.includes(phoneNumber)) {
      if (!Utils.checkHash(hash)) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeFailedHashCheck,
          type: Const.logTypeLogin,
          message: `SMSVerificationController, ${phoneNumber} failed hash check`,
        });
      }
    }

    logger.info(`SmsVerificationController - ${phoneNumber} - Passed hash check`);

    /*
      await detectFlooding();

      const countryBan = await CountryWideBan
        .findOne({
          countryCode: phoneCountryCode,
          created: { $gt: Date.now() - Const.millisecondsPerDay },
        })
        .lean();

      if (countryBan && countryBan.countryCode === phoneCountryCode) {
        const diff = Date.now() - countryBan.updated;
        const banDurationInMilliseconds =
          Utils.getCountryBanDuration(countryBan.occurences) * 60 * 1000;

        if (diff < banDurationInMilliseconds) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeCountryTemporarilyBanned,
            type: Const.logTypeLogin,
            message: `SMSVerificationController, ${phoneNumber} - country temporarily banned`,
          });
        }
      }
        */

    if (phoneNumber.startsWith("+234803200") || phoneNumber.startsWith("+234810000")) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodePhoneNumberIsBlocked,
        type: Const.logTypeLogin,
        message: `SMSVerificationController, phonenumber ${phoneNumber} is blocked (MTN)`,
      });
    }

    const existingUser = await User.findOne({ phoneNumber, "isDeleted.value": false }).lean();

    let allowed = false;
    if (existingUser?.phoneNumberStatus === Const.phoneNumberValid) {
      allowed = true;
    } else if (existingUser?.phoneNumberStatus === Const.phoneNumberInvalid) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodePhoneNumberIsBlocked,
        type: Const.logTypeLogin,
        message: `SMSVerificationController, phonenumber ${phoneNumber} is blocked`,
      });
    }

    logger.info(`SmsVerificationController - ${phoneNumber} - Number isn't blocked`);

    if (Config.environment === "production" && !allowed) {
      const {
        allowed: checkAllowed,
        errorCode,
        errorMessage,
      } = await Utils.checkIfCarrierIsAllowed(phoneNumber);

      if (!checkAllowed) {
        return Base.newErrorResponse({
          response,
          code: errorCode,
          type: Const.logTypeLogin,
          message: `SMSVerificationController, ${errorMessage}`,
        });
      } else if (existingUser) {
        existingUser.phoneNumberStatus = Const.phoneNumberValid;
      }
    }

    logger.info(`SmsVerificationController - ${phoneNumber} - Carrier is checked and allowed`);

    const activationCode = generateActivationCode(phoneNumber, attempt);

    if (Config.sendActivationCode && !Const.demoPhoneNumbers.includes(phoneNumber)) {
      if (!isWebClient) {
        sendActivationCode(phoneNumber, activationCode, attempt);
      } else if (!reCaptcha) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeNoReCaptchaParameter,
          type: Const.logTypeLogin,
          message: "SMSVerificationController, send sms code - reCaptcha parameter missing",
        });
      } else {
        const reCaptchaResult = await Utils.checkReCaptcha(reCaptcha, Config.newReCaptchaSecret);
        if (!reCaptchaResult) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeReCaptchaFailed,
            type: Const.logTypeLogin,
            message: "SMSVerificationController, send sms code - reCaptcha failed",
          });
        }
        sendActivationCode(phoneNumber, activationCode);
      }
    }

    const { rates } = await Utils.getConversionRates();
    const { latitude, longitude } = ipAddressObj;

    if (existingUser) {
      const {
        _id,
        userName,
        invitationUri,
        countryCode,
        currency,
        deviceType: deviceTypeFromUserModel,
        lightningUserName,
        payoutFrequency,
        location,
      } = existingUser;
      const updateObj = { activationCode, isAppUser: true };

      if (!userName) {
        updateObj.userName = `Flomer_${_id.toString()}`;
      }

      const { coordinates = null } = location || {};
      if ((!coordinates || !coordinates[0]) && latitude && longitude) {
        updateObj.location = { type: "Point", coordinates: [longitude, latitude] };
      }

      if (!countryCode) {
        updateObj.countryCode = Utils.getCountryCodeFromPhoneNumber({
          phoneNumber: existingUser.phoneNumber,
        });
      }

      if (!currency) {
        if ((countryCode || updateObj.countryCode) && rates) {
          updateObj.currency = Utils.getCurrencyFromCountryCode({
            countryCode: countryCode || updateObj.countryCode,
            rates,
          });
        }
      }

      updateObj.phoneNumberStatus = existingUser.phoneNumberStatus;

      if (!deviceTypeFromUserModel) updateObj.deviceType = deviceType;

      if (!lightningUserName) {
        let stringExists = false;

        do {
          const randomString = Utils.getRandomString(8).toLowerCase();

          const lnRegex = new RegExp(`^${randomString}$`, "i");
          const alreadyExists = await User.findOne({
            $or: [{ lightningUserName: lnRegex }, { userName: lnRegex }],
          }).lean();
          if (alreadyExists) {
            stringExists = true;
          } else {
            updateObj.lightningUserName = randomString;
            stringExists = false;
          }
        } while (stringExists);
      } else if (/[A-Z]/.test(lightningUserName)) {
        updateObj.lightningUserName = lightningUserName.toLowerCase();
      }

      if (!payoutFrequency) {
        updateObj.payoutFrequency = Const.payoutFrequencyNever;
      }

      await User.findByIdAndUpdate(_id.toString(), { $set: updateObj });
    } else {
      await createNewUser({
        phoneNumber,
        activationCode,
        ref,
        phoneNumberStatus: Const.phoneNumberValid,
        deviceType,
        rates,
        latitude,
        longitude,
      });
    }

    logger.info(
      `SmsVerificationController - ${phoneNumber} - New user created or existing updated`,
    );
    console.log("kooood   ", activationCode);
    return Base.successResponse(response, Const.responsecodeSucceed);
  } catch (e) {
    logger.error(`Error in SMS Verification for ${request.body.phoneNumber}: `, e);

    if (e.message === "Missing phoneNumber!") {
      return Base.successResponse(response, Const.responsecodeNoPhoneNumber);
    }

    if (e.message === "Wrong phoneNumber format!") {
      return Base.successResponse(response, Const.responsecodeWrongPhoneNumberFormat);
    }

    return Base.errorResponse(response, Const.httpCodeServerError);
  }
});

function validatePhoneNumber(number) {
  let errorMessage = null;

  if (!number) {
    errorMessage = "Missing phoneNumber!";
  }

  if (number && (number.includes("-") || number.charAt(0) !== "+")) {
    errorMessage = "Wrong phoneNumber format!";
  }

  if (errorMessage) {
    throw new Error(errorMessage);
  }
}

function generateActivationCode(phoneNumber, attempt) {
  const env = Config.environment;

  if (
    env === "devRoja" ||
    env === "development" ||
    env === "devPacket" ||
    Const.fakeTestingPhoneNumbers.includes(phoneNumber) ||
    Const.demoPhoneNumbers.includes(phoneNumber)
  ) {
    return "555555";
  }

  function createSimpleActivationCode(length) {
    const num1 = Math.floor(Math.random() * 9) + 1;
    const num2 = Math.floor(Math.random() * 9) + 1;

    let activationCode = "";

    for (let i = 0; i < length; i++) {
      if (i % 2 === 0) {
        activationCode += num1;
      } else {
        activationCode += num2;
      }
    }
    return activationCode;
  }

  if (Utils.eligibleForUSSD(phoneNumber) && attempt !== 2) {
    return createSimpleActivationCode(6);
  }

  return Utils.generateRandomNumber(6);
}

async function sendActivationCode(phoneNumber, activationCode, attempt) {
  try {
    const message = `Your activation code for Flom is ${activationCode}\n\nozJwsIQT2iz`;
    await Utils.sendSMSv2({ phoneNumber, message, type: "login" });

    logger.info(`SmsVerificationController - ${phoneNumber} - Activation code sent`);
  } catch (error) {
    logger.error(`SmsVerificationController - ${phoneNumber} - Activation code error`, error);
  }
}

async function sendUSSDPush(phoneNumber, message, pushType = 2) {
  const data = {
    pushToken: {
      phoneNumber,
    },
    payload: { type: pushType, message },
  };
  return Utils.callPushService(data);
}

async function detectFlooding() {
  const records = await AccessRecord.find({
    created: { $gt: Date.now() - Const.floodPeriod },
  });

  if (records.length < Const.floodLimit) return false;

  const countryObj = {};

  for (const record of records) {
    if (!countryObj[record.countryCode]) countryObj[record.countryCode] = 0;
    countryObj[record.countryCode]++;
  }

  let max = 0,
    maxCountry;
  for (const country in countryObj) {
    if (countryObj[country] > max) {
      max = countryObj[country];
      maxCountry = country;
    }
  }

  if (max > records.length / 2) {
    const countryBan = await CountryWideBan.findOne({ countryCode: maxCountry }).lean();

    let updateObj = {};

    if (countryBan && countryBan.created > Date.now() - Const.millisecondsPerDay) {
      if (countryBan.updated) {
        const diff = Date.now() - countryBan.updated;
        const banDurationInMilliseconds =
          Utils.getCountryBanDuration(countryBan.occurences) * 60 * 1000;

        if (diff > banDurationInMilliseconds) {
          updateObj = {
            $set: { countryCode: maxCountry, updated: Date.now() },
            $inc: { occurences: 1 },
          };
        }
      }
    } else {
      updateObj = {
        $set: { countryCode: maxCountry, updated: Date.now(), created: Date.now(), occurences: 1 },
      };
    }

    if (Object.keys(updateObj).length > 0) {
      await CountryWideBan.updateOne({ countryCode: maxCountry }, updateObj, {
        upsert: true,
        setDefaultsOnInsert: true,
      });

      Utils.sendEmailWithSG(
        "Flom: Flood detection",
        `Flood detected at ${Date()} on environment: ${Config.environment}`,
        "petarb.flom@gmail.com",
      );
      Utils.sendEmailWithSG(
        "Flom: Flood detection",
        `Flood detected at ${Date()} on environment: ${Config.environment}`,
        "sinisa.brcina@pontistechnology.com",
      );
    }
  }

  return true;
}

async function detectUserFlooding({ phoneNumber }) {
  const user = await User.findOne({ phoneNumber }).lean();
  if (user && user._id.toString() === Config.flomSupportAgentId) {
    return { flood: false };
  }

  const recordsInLastHour = await AccessRecord.find({
    phoneNumber,
    created: { $gt: Date.now() - 60 * 60 * 1000 },
  }).lean();

  // limits are +1 so the ban starts from last banned login attempt instead of last non-banned attempt

  if (recordsInLastHour.length >= 3) {
    await TemporaryBan.updateOne(
      { phoneNumber },
      { created: Date.now(), duration: 1000 * 60 * 30 },
      { upsert: true },
    );

    return { flood: true, duration: 30, unitOfTime: "minutes" };
  }

  const recordsInLastDay = await AccessRecord.find({
    phoneNumber,
    created: { $gt: Date.now() - 24 * 60 * 60 * 1000 },
  }).sort({ created: -1 });

  if (recordsInLastDay.length >= 6) {
    await TemporaryBan.updateOne(
      { phoneNumber },
      { created: Date.now(), duration: 1000 * 60 * 60 * 12 },
      { upsert: true },
    );

    return { flood: true, duration: 12, unitOfTime: "hours" };
  }

  return { flood: false };
}

module.exports = router;
