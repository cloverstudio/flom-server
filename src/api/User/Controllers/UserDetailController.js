"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { AppVersion, User, ApiAccessLog } = require("#models");
const Logics = require("#logics");

/**
 * @api {get} /api/v2/user/detail/:userId User Details Flom v1
 * @apiVersion 2.0.8
 * @apiName User Details
 * @apiGroup WebAPI User
 * @apiDescription Returns user detail
 *
 * @apiSuccessExample Success-Response:
 * {
 *   "code": 1,
 *   "time": 1631783235064,
 *   "data": {
 *     "user": {
 *       "_id": "5f7ee464a283bc433d9d722f",
 *       "pushToken": [
 *         "cPTIMfiQBi4vWzVsEuB"
 *       ],
 *       "webPushSubscription": [],
 *       "voipPushToken": [],
 *       "groups": [
 *         "5caf311bec0abb18999bd755"
 *       ],
 *       "muted": [],
 *       "blocked": [],
 *       "devices": [],
 *       "UUID": [
 *         {
 *           "deviceName": "XQ-AS52",
 *           "lastLogin": 1630318511790,
 *           "blocked": null,
 *           "lastToken": {
 *             "token": "*****",
 *             "generateAt": 1630318511790
 *           },
 *           "pushTokens": [
 *             "cPTIMfiQBi4vWzVsEuB"
 *           ]
 *         }
 *       ],
 *       "bankAccounts": [
 *         {
 *           "merchantCode": "40200168",
 *           "name": "SampleAcc",
 *           "accountNumber": "1503567574679",
 *           "code": "",
 *           "selected": true,
 *           "lightningUserName": "40200168",
 *           "lightningAddress": "40200168@v2.flom.dev",
 *           "lightningUrlEncoded": "LNURL1DP68GURN8GHJ7A3J9ENXCMMD9EJX2A309EMK2MRV944KUMMHDCHKCMN4WFK8QTE5XQERQVP3XCUQXZ6U2G"
 *         }
 *       ],
 *       "location": {
 *         "type": "Point",
 *         "coordinates": [
 *           0,
 *           0
 *         ]
 *       },
 *       "locationVisibility": false,
 *       "isAppUser": true,
 *       "flomSupportAgentId": null,
 *       "newUserNotificationSent": true,
 *       "followedBusinesses": [],
 *       "likedProducts": [
 *         "5f4f5ab618f352279ef2a82d"
 *       ],
 *       "createdBusinessInFlom": false,
 *       "onAnotherDevice": true,
 *       "shadow": false,
 *       "name": "+2348*****0007",
 *       "organizationId": "5caf3119ec0abb18999bd753",
 *       "status": 1,
 *       "created": 1602151524372,
 *       "phoneNumber": "+2348020000007",
 *       "userName": "dragon2",
 *       "invitationUri": "https://flom.page.link/wnLdbuLTY4qfhbqo9",
 *       "__v": 115,
 *       "avatar": {
 *         "picture": {
 *           "originalName": "cropped2444207444774310745.jpg",
 *           "size": 4698848,
 *           "mimeType": "image/png",
 *           "nameOnServer": "profile-3XFUoWqVRofEPbMfC1Z9IDNj"
 *         },
 *         "thumbnail": {
 *           "originalName": "cropped2444207444774310745.jpg",
 *           "size": 97900,
 *           "mimeType": "image/png",
 *           "nameOnServer": "thumb-wDIl52el9inZOQ20yNn2PpnMwi"
 *         }
 *       },
 *       "lastName": "D",
 *       "description": "Don't steal my account!",
 *       "firstName": "Marko",
 *       "activationCode": null,
 *       "typeAcc": 1,
 *       "email": "marko.d@clover.studio",
 *       "recentlyViewedProducts": [
 *         "611a34bafb0dff46efb379dc"
 *       ],
 *       "paymentProfileId": "900720084",
 *       "featuredProductTypes": [
 *         1,
 *         2
 *       ],
 *       "blockedProducts": 0,
 *       "cover": {},
 *       "memberships": [],
 *       "socialMedia": [
 *         {
 *           "username": "spotiii",
 *           "type": 1
 *         },
 *         {
 *           "username": "aplalll",
 *           "type": 2
 *         },
 *         {
 *           "username": "zoutuu",
 *           "type": 5,
 *           "profileWebUrl": "https://www.youtube.com/user/zoutuu",
 *           "profileIOSUrl": "youtube://www.youtube.com/user/zoutuu",
 *           "profileAndroidUrl": "youtube://www.youtube.com/user/zoutuu"
 *         }
 *       ],
 *       "isCreator": true,
 *       "isSeller": true,
 *       "isVerified": true,
 *       "groupModels": [
 *         {
 *           "_id": "5caf311bec0abb18999bd755",
 *           "users": [
 *             "5caf311aec0abb18999bd754"
 *           ],
 *           "name": "Top",
 *           "sortName": "top",
 *           "description": "",
 *           "created": 1554985243743,
 *           "organizationId": "5caf3119ec0abb18999bd753",
 *           "parentId": "",
 *           "type": 2,
 *           "default": true,
 *           "__v": 0
 *         }
 *       ],
 *       "organization": {
 *         "_id": "5caf3119ec0abb18999bd753",
 *         "name": "flomorg",
 *         "organizationId": "flomorg"
 *       },
 *       "onlineStatus": null,
 *       "productsCount": 17,
 *       "soldProductsCount": 0,
 *       "subscribersCount": 2,
 *       "creatorMemberships": [
 *         {
 *           "_id": "6141c7a02f95906c64e83c43",
 *           "benefits": [
 *             {
 *               "type": 1,
 *               "title": "Group chat",
 *               "enabled": true
 *             },
 *             {
 *               "type": 2,
 *               "title": "Private messaging",
 *               "enabled": false
 *             },
 *             {
 *               "type": 3,
 *               "title": "Video call",
 *               "enabled": false
 *             },
 *             {
 *               "type": 4,
 *               "title": "Audio call",
 *               "enabled": false
 *             }
 *           ],
 *           "created": 1631700896862,
 *           "name": "Plan 1",
 *           "amount": 4.99,
 *           "description": "This is the lowest plan. Enjoy it!",
 *           "order": 1,
 *           "creatorId": "5f7ee464a283bc433d9d722f",
 *           "__v": 0
 *         },
 *       ],
 *       "membersCount": 1,
 *       "notifications": { //present only if you get details of your own user
 *         "timestamp": 1631700896862,
 *         "unreadCount": 0,
 *       }
 *     },
 *     "androidBuildVersion": "56",
 *     "iosBuildVersion": "72"
 *     "groupCallBaseUrl": "https://devgroupcall.flom.app/"
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 4000017 Invalid userId or user not found
 */

router.get("/:userId", async function (request, response) {
  try {
    const { userId } = request.params;
    if (!userId) {
      return Base.successResponse(response, Const.responsecodeUserDetailInvalidUserId);
    }

    if (!Utils.isValidObjectId(userId)) {
      return Base.successResponse(response, Const.responsecodeUserDetailInvalidUserId);
    }

    const user = await User.findOne({ _id: userId }).lean();

    /*if (user.nigerianBankAccounts && user.nigerianBankAccounts.length > 0) {
        user.nigerianBankAccounts.forEach((bankAccount) => {
          if (bankAccount.logoFileName?.length > 0) {
            bankAccount.logoUrl = `${Config.webClientUrl}/api/v2/payment-methods/get-logo/${bankAccount.logoFileName}`;
          } else {
            bankAccount.logoUrl = `${Config.webClientUrl}/api/v2/payment-methods/get-logo/payment-1.png`;
          }
          delete bankAccount.logoFileName;
        });
      }*/

    if (!user) {
      return Base.successResponse(response, Const.responsecodeUserNotFound);
    }
    if (user?.isDeleted.value) {
      return Base.successResponse(response, Const.responsecodeUserDeleted);
    }

    let appVersion = await AppVersion.findOne({});
    if (!appVersion) {
      appVersion = await AppVersion.create({
        iosBuildVersion: "72",
        androidBuildVersion: "56",
      });
    }

    const usersTokens = user.token || [];

    for (const token of usersTokens) {
      if (request.headers["access-token"] && token.token === request.headers["access-token"]) {
        // update ios & android versions
        const accessToken = request.headers["access-token"];
        const isAdmin = accessToken.length == Const.adminPageTokenLength;

        const updateObj = {};

        if (!isAdmin) {
          const androidVersionCode = !request.headers["android-version-code"]
            ? 0
            : +request.headers["android-version-code"].toString();
          const androidVersionName = !request.headers["android-version-name"]
            ? ""
            : request.headers["android-version-name"].toString();
          const iosVersionCode = !request.headers["ios-version-code"]
            ? 0
            : +request.headers["ios-version-code"].toString();
          const iosVersionName = !request.headers["ios-version-name"]
            ? ""
            : request.headers["ios-version-name"].toString();

          if (androidVersionCode && user.androidVersionCode !== androidVersionCode) {
            updateObj.androidVersionCode = androidVersionCode;
            user.androidVersionCode = androidVersionCode;
          }
          if (androidVersionName && user.androidVersionName !== androidVersionName) {
            updateObj.androidVersionName = androidVersionName;
            user.androidVersionName = androidVersionName;
          }
          if (iosVersionCode && user.iosVersionCode !== iosVersionCode) {
            updateObj.iosVersionCode = iosVersionCode;
            user.iosVersionCode = iosVersionCode;
          }
          if (iosVersionName && user.iosVersionName !== iosVersionName) {
            updateObj.iosVersionName = iosVersionName;
            user.iosVersionName = iosVersionName;
          }
        }

        // update device language
        const deviceLanguage = request.headers.lang;

        if (deviceLanguage && user.deviceLanguage !== deviceLanguage) {
          updateObj.deviceLanguage = deviceLanguage;
          user.deviceLanguage = deviceLanguage;
        }

        // update address
        if (!user.address && user.location?.coordinates) {
          const {
            location: { coordinates = [0, 0] },
          } = user;

          if (coordinates[0] !== 0 || coordinates[1] !== 0) {
            await ApiAccessLog.create({
              type: "LocationIQ",
              api: "UserDetailController",
              userName: user.userName,
              createdDate: new Date(),
            });

            try {
              const address = await Utils.getAddressFromCoordinates({
                lat: coordinates[1],
                lon: coordinates[0],
              });

              updateObj.address = address;
              user.address = address;
            } catch (error) {
              logger.error("UserDetailController, address", error);
            }
          }
        }

        // update last active date
        const newLastActive = Date.now();
        updateObj.lastActive = newLastActive;
        user.lastActive = newLastActive;

        // set auction payment method to default if not set
        if (!user.auctionPaymentMethod && !user.auctionPaymentMethodLocked) {
          if (user.countryCode === "NG") {
            updateObj.auctionPaymentMethod = Const.auctionPaymentMethodType.TRANSFER;
          } else if (user.paymentProfileId) {
            updateObj.auctionPaymentMethod = Const.auctionPaymentMethodType.CREDIT_CARD;
          }
        }

        // set time zone if not set
        if (!user.timeZone) {
          const timeZone = request.headers["timezone"];
          if (timeZone) {
            updateObj.timeZone = timeZone;
            user.timeZone = timeZone;
          }
        }

        // set mention slug if not set
        if (!user.whatsApp?.mentionSlug && !user.userName.startsWith("Flomer_")) {
          const mentionSlug = await Logics.generateMentionSlug(user.userName);
          updateObj["whatsApp.mentionSlug"] = mentionSlug;
          if (!user.whatsApp) user.whatsApp = {};
          user.whatsApp.mentionSlug = mentionSlug;
        }

        // set reference if not set
        if (!user.whatsApp?.reference) {
          const reference = await Utils.getRandomString(10, "alpha");
          updateObj["whatsApp.reference"] = reference;
          if (!user.whatsApp) user.whatsApp = {};
          user.whatsApp.reference = reference;
        }

        if (Object.keys(updateObj).length > 0) {
          await User.findByIdAndUpdate(userId, updateObj);
        }

        // visiting streak bonus credits
        const { visitingStreak = [] } = user;
        const lastStreakTimestamp = visitingStreak[0] ?? null;

        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        if (today.getTime() !== lastStreakTimestamp) {
          await Logics.sendBonus({ userId, bonusType: Const.bonusTypeVisitingStreak });
        }
      }
    }

    await Logics.formatUserDetailsResponse({
      user,
      requestAccessToken: request.headers["access-token"],
    });

    Base.successResponse(response, Const.responsecodeSucceed, {
      user,
      androidBuildVersion: appVersion.androidBuildVersion,
      iosBuildVersion: appVersion.iosBuildVersion,
      groupCallBaseUrl: Config.groupCallBaseUrl,
    });
  } catch (error) {
    return Base.errorResponse(response, Const.httpCodeServerError, "UserDetailController", error);
  }
});

module.exports = router;
