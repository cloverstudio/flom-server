"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { User, DidWWNumber, DidWWLog, BannedNumber } = require("#models");
const { createNewUser } = require("#logics");

/**
 * @api {post} /api/v2/login/did/check-number Check registration/login
 * @apiName Check registration/login
 * @apiGroup WebAPI
 * @apiDescription  Checks if registration/login is valid. destinationPhoneNumber should be sent in request body.
 * @apiHeader {String} UUID or uuid UUID
 *
 * @apiParam {String} destinationPhoneNumber destinationPhoneNumber
 *
 * @apiSuccessExample Success-Response:
 * {
 *     "code": 1,
 *     "time": 1696402392233,
 *     "data": {
 *             "user": {
 *                 "token": [
 *                     {
 *                         "token": "*****",
 *                         "generateAt": 1696402392222,
 *                         "isWebClient": false
 *                     }
 *                 ],
 *                 "pushToken": [],
 *                 "webPushSubscription": [],
 *                 "voipPushToken": [],
 *                 "groups": [
 *                     "5caf311bec0asdsda9bd755"
 *                 ],
 *                 "muted": [],
 *                 "blocked": [],
 *                 "devices": [],
 *                 "UUID": [],
 *                 "bankAccounts": [],
 *                 "location": {
 *                     "type": "Point",
 *                     "coordinates": [
 *                         0,
 *                         0
 *                     ]
 *                 },
 *                 "isAppUser": true,
 *                 "flomAgentId": null,
 *                 "newUserNotificationSent": false,
 *                 "followedBusinesses": [],
 *                 "likedProducts": [],
 *                 "recentlyViewedProducts": [],
 *                 "createdBusinessInFlom": false,
 *                 "onAnotherDevice": false,
 *                 "shadow": false,
 *                 "isDeleted": {
 *                     "value": false,
 *                     "created": 1696402146386
 *                 },
 *                 "featuredProductTypes": [],
 *                 "blockedProducts": 0,
 *                 "memberships": [],
 *                 "socialMedia": [],
 *                 "socialMediaLinks": [],
 *                 "isCreator": false,
 *                 "isSeller": false,
 *                 "notifications": {
 *                     "timestamp": 0,
 *                     "unreadCount": 0
 *                 },
 *                 "phoneNumberStatus": 1,
 *                 "payoutFrequency": 5,
 *                 "lastPayoutDate": 0,
 *                 "merchantApplicationStatus": null,
 *                 "locationVisibility": false,
 *                 "creditBalance": 0,
 *                 "deletedUserInfo": {
 *                     "bankAccounts": []
 *                 },
 *                 "emailActivation": {
 *                     "isVerified": false
 *                 },
 *                 "kidsMode": false,
 *                 "satsBalance": 0,
 *                 "lightningInfo": [],
 *                 "hasChangedLnUserName": false,
 *                 "_id": "651d0ae236598e26508c60a0",
 *                 "name": "Flomer_651d0ae236598e26508c60a0",
 *                 "organizationId": "5caf3119ec0abb18999bd753",
 *                 "status": 1,
 *                 "created": 1696402146387,
 *                 "phoneNumber": "+385990000007",
 *                 "userName": "Flomer_651d0ae236598e26508c60a0",
 *                 "invitationUri": "https://qrios.page.link/8uPadsadsdshSXPw7",
 *                 "countryCode": "HR",
 *                 "hasLoggedIn": 2,
 *                 "lightningUserName": "jadsdvwr",
 *                 "__v": 0
 *             },
 *             "tkn": "gRbrsdaddd3kvlC"
 *         }
 * }
 **/

router.post("", async (request, response) => {
  try {
    const destinationPhoneNumber = request.body.destinationPhoneNumber;
    const hash = request.body.token;

    const deviceType = request.headers["device-type"];
    const IP = request.headers["x-forwarded-for"] || request.connection.remoteAddress;
    const UUID = request.headers["UUID"] || request.headers["uuid"];

    if (!destinationPhoneNumber) {
      return Base.successResponse(response, Const.responsecodeNoPhoneNumber);
    }

    if (!Utils.checkHashDidWW(hash, 40, destinationPhoneNumber)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeFailedHashCheck,
        type: Const.logTypeLogin,
        message: `CheckNumberDidWWController, failed hash check, destination number - ${destinationPhoneNumber}`,
      });
    }

    const didWWNumber = await DidWWNumber.findOne({
      phoneNumber: destinationPhoneNumber,
      isReserved: true,
    }).lean();

    if (!didWWNumber) {
      return Base.successResponse(response, Const.responsecodeDidWWPhoneNumberNotExistsOrNotRes);
    }

    const didWWNumberLogs = await DidWWLog.find({
      created: { $gt: didWWNumber.modified },
      destinationPhoneNumber,
    }).lean();

    logger.info("didWWNumberLogs ", didWWNumberLogs);

    let dataToSend = {};

    if (didWWNumberLogs.length > 1) {
      return Base.successResponse(response, Const.responsecodeDidWWPhoneNumberReservedMoreThanOnce);
    }

    if (didWWNumberLogs.length !== 1) {
      return Base.successResponse(response, Const.responsecodeDidWWNoEntryFromCb);
    }

    let phoneNumber = didWWNumberLogs[0].sourcePhoneNumber;
    if (!phoneNumber.startsWith("+")) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidPhoneNumber,
        type: Const.logTypeLogin,
        message: `CheckNumberDidWWController, phonenumber ${phoneNumber} is invalid`,
      });
    }
    phoneNumber = Utils.formatPhoneNumber({ phoneNumber });

    if (phoneNumber.startsWith("+234803200") || phoneNumber.startsWith("+234810000")) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodePhoneNumberIsBlocked,
        type: Const.logTypeLogin,
        message: `CheckNumberDidWWController, phonenumber ${phoneNumber} is blocked (MTN)`,
      });
    }

    const bannedNumber = await BannedNumber.findOne({ phoneNumber }).lean();
    if (bannedNumber) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodePhoneNumberIsBlocked,
        type: Const.logTypeLogin,
        message: `CheckNumberDidWWController, ${phoneNumber} banned phone number`,
      });
    }

    // IP Check
    logger.info(`CheckNumberDidWWController - ${phoneNumber} - IP: ${IP}`);

    const ipAddressObj = await Utils.getCountryFromIpAddress({ IP });

    if (ipAddressObj?.isVPN && Config.environment === "production") {
      const existingUser = await User.findOne({ phoneNumber, "isDeleted.value": false }).lean();

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
          message: `CheckNumberDidWWController, VPN detected`,
        });
      }
    }

    let user = await User.findOne({ phoneNumber, "isDeleted.value": false });

    let allowed = false;
    if (user?.phoneNumberStatus === Const.phoneNumberValid) {
      allowed = true;
    } else if (user?.phoneNumberStatus === Const.phoneNumberInvalid) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodePhoneNumberIsBlocked,
        type: Const.logTypeLogin,
        message: `CheckNumberDidWWController, phonenumber ${phoneNumber} is blocked`,
      });
    }

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
          message: `CheckNumberDidWWController, ${errorMessage}`,
        });
      } else if (user) {
        user.phoneNumberStatus = Const.phoneNumberValid;
      }
    }

    const { rates } = await Utils.getConversionRates();
    const { latitude, longitude } = ipAddressObj;

    if (!user) {
      logger.info("didWWNumberLogs ", didWWNumberLogs);
      user = await createNewUser(
        {
          phoneNumber,
          deviceType,
          phoneNumberStatus: Const.phoneNumberValid,
          rates,
          latitude,
          longitude,
        },
        true,
      );
    } else {
      const {
        _id,
        userName,
        countryCode,
        currency,
        deviceType: deviceTypeFromUserModel,
        lightningUserName,
        payoutFrequency,
        location,
      } = user;

      if (!userName) {
        user.userName = `Flomer_${_id.toString()}`;
      }

      if (!countryCode) {
        user.countryCode = Utils.getCountryCodeFromPhoneNumber({
          phoneNumber,
        });
      }

      if (!currency) {
        if (user.countryCode && rates) {
          user.currency = Utils.getCurrencyFromCountryCode({
            countryCode: user.countryCode,
            rates,
          });
        }
      }

      const { coordinates = null } = location || {};
      if ((!coordinates || !coordinates[0]) && latitude && longitude) {
        user.location = { type: "Point", coordinates: [longitude, latitude] };
      }

      user.phoneNumberStatus = user.phoneNumberStatus;

      if (!deviceTypeFromUserModel) user.deviceType = deviceType;

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
            user.lightningUserName = randomString;
            stringExists = false;
          }
        } while (stringExists);
      } else if (/[A-Z]/.test(lightningUserName)) {
        user.lightningUserName = lightningUserName.toLowerCase();
      }

      if (!payoutFrequency) {
        user.payoutFrequency = Const.payoutFrequencyNever;
      }
    }

    const newToken = Utils.getRandomString(Const.tokenLength);
    const now = Utils.now();

    const tokenObj = {
      token: newToken,
      generateAt: now,
      isWebClient: false,
    };

    let tokenAry = user.token.filter((t) => t.isWebClient);

    tokenAry.push(tokenObj);

    user.token = tokenAry;

    user.hasLoggedIn = Const.userLoggedInAtLeastOnce;

    if (!user.firstLogin && user.lastLogin) {
      user.firstLogin = 1;
    } else if (!user.firstLogin) {
      user.firstLogin = Date.now();
    }
    user.lastLogin = Date.now();
    user.loginCount = !user.loginCount ? 1 : user.loginCount + 1;

    user.save();

    dataToSend.user = user.toObject();
    dataToSend.tkn = newToken;

    await DidWWNumber.findOneAndUpdate(
      { phoneNumber: destinationPhoneNumber, isReserved: true },
      { isReserved: false, modified: Date.now() },
    ).lean();
    await User.findByIdAndUpdate(user._id.toString(), { $set: { ...user } });

    const supportUser = await User.findById(Config.flomSupportUserId).lean();
    dataToSend.supportUser = supportUser;

    Base.successResponse(response, Const.responsecodeSucceed, dataToSend);
  } catch (e) {
    return Base.errorResponse(response, Const.httpCodeServerError, "CheckNumberDidWWController", e);
  }
});

module.exports = router;
