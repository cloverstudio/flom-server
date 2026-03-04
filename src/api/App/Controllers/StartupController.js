"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { Configuration, PaymentMethod, TransferType, SprayValue } = require("#models");

const {
  getFlomUsers,
  syncContacts,
  getCountries,
  getLimits,
  getCreditPackages,
  updateUsersBankAccounts,
} = require("../helpers");

/**
 * @api {post} /api/v2/app/startup Startup API
 * @apiVersion 2.0.8
 * @apiName Startup API
 * @apiGroup WebAPI App
 * @apiDescription API which is called when the user launches the app. It returns: users, countries, transfer types, payment methods,
 * flomUsersMap and strings. Compared to new flom startup API this API wont return: popup data, last interaction for user nor favorites.
 *
 * @apiHeader {String} access-token Users unique access token
 *
 * @apiParam {String} phoneNumbers List of phone numbers separated by a comma.
 * Example: "+385987654324,+385998765456,+385916342536".
 *
 * @apiSuccessExample Success Response
 * {
 *   "code": 1,
 *   "time": 1636108674630,
 *   "data": {
 *     "users": [
 *       {
 *         "_id": "5f7ee464a283bc433d9d722f",
 *         "username": "dragon",
 *         "phoneNumber": "+2348020000007",
 *         "countryCode": "NG",
 *         "avatar": {
 *           "thumbnail": {
 *             "originalName": "cropped2444207444774310745.jpg",
 *             "size": 97900,
 *             "mimeType": "image/png",
 *             "nameOnServer": "thumb-wDIl52eluinZOQ20yNn2PpnMwi",
 *             "link": "https://dev.flom.app/api/v2/avatar/user/thumb-wDIl52eluinZOQ20yNn2PpnMwi"
 *           },
 *           "picture": {
 *             "originalName": "cropped2444207444774310745.jpg",
 *             "size": 4698848,
 *             "mimeType": "image/png",
 *             "nameOnServer": "profile-3XFUoWqVRofEPbMfC1ZKIDNj",
 *             "link": "https://dev.flom.app/api/v2/avatar/user/profile-3XFUoWqVRofEPbMfC1ZKIDNj"
 *           }
 *         },
 *         "lastName": "D",
 *         "description": "Don't steal my account!",
 *         "firstName": "Marko",
 *         "email": "marko.d2@clover.studio",
 *       },
 *       {
 *         "_id": "61377add1f60bd126f66ca36",
 *         "username": "61377add1f60bd126f66ca36",
 *         "phoneNumber": "+2348020000011",
 *         "countryCode": "NG",
 *         "email": "me@me.com",
 *         "avatar": {
 *           "thumbnail": {},
 *           "picture": {}
 *         }
 *       }
 *     ],
 *     "countries": [
 *       {
 *         "countryCode": "HR",
 *         "conversionRate": {
 *           "date": "2021-11-05",
 *           "currencyFrom": "USD",
 *           "currencyTo": "HRK",
 *           "rate": 6.552111
 *         },
 *         "phoneNumbers": [
 *           "+385996667841",
 *           "385997846638",
 *           "+385997846638"
 *         ],
 *         "transferTypes": {
 *           "allowed": [],
 *           "notice": "Gifting is not available for this contact’s country. Check to be sure the country code (e.g. +53, +268, etc.) is correct."
 *         }
 *       },
 *       {
 *         "countryCode": "NG",
 *         "conversionRate": {
 *           "date": "2021-11-05",
 *           "currencyFrom": "USD",
 *           "currencyTo": "NGN",
 *           "rate": 350
 *         },
 *         "phoneNumbers": [
 *           "018224998",
 *           "+2348020000007",
 *           "08020000008",
 *           "2348020000010",
 *           "(234)-802-00000-11",
 *           "+2348020000020"
 *         ],
 *         "transferTypes": {
 *           "allowed": [
 *             1,
 *             2
 *           ]
 *         }
 *       },
 *       {
 *         "countryCode": "US",
 *         "conversionRate": {
 *           "date": "2021-11-05",
 *           "currencyFrom": "USD",
 *           "currencyTo": "USD",
 *           "rate": 1
 *         },
 *         "phoneNumbers": [
 *           "+19728788506"
 *         ],
 *         "transferTypes": {
 *           "allowed": [
 *             1,
 *             2
 *           ]
 *         }
 *       }
 *     ],
 *     "transferTypes": [
 *       {
 *         "type": 1,
 *         "name": "Top up",
 *         "disabled": false,
 *         "supportedCountries": [
 *           "ZA",
 *           "AF",
 *           "NG"
 *         ],
 *         "promoText": "Sometimes up to 55% more than other platforms"
 *       },
 *       {
 *         "type": 2,
 *         "name": "Data",
 *         "disabled": false,
 *         "supportedCountries": [
 *           "BD",
 *           "BS",
 *           "TT",
 *           "GN",
 *           "CR",
 *           "NG"
 *         ],
 *         "promoText": "Sometimes up to 55% more than other platforms"
 *       }
 *     ],
 *     "paymentMethods": [
 *       {
 *         "type": 1,
 *         "name": "Credit card",
 *         "disabled": false,
 *         "fee": {
 *           "percent": 0,
 *           "flat": 0
 *         },
 *         "logoLink": "https://dev.flom.app/api/v2/payment-methods/logo/1",
 *         "selected": true
 *       },
 *       {
 *         "type": 2,
 *         "name": "PayPal",
 *         "disabled": false,
 *         "fee": {
 *           "percent": 0,
 *           "flat": 0
 *         },
 *         "logoLink": "https://dev.flom.app/api/v2/payment-methods/logo/2",
 *         "selected": false
 *       }
 *     ],
 *     "flomUsersMap": [
 *       {
 *         "rawPhoneNumber": "(234)-802-00000-11",
 *         "flomUserPhoneNumber": "+2348020000011"
 *       }
 *     ],
 *     "strings": {
 *       "topUpEnabled": "Top-up transfers are supported to this contact’s country",
 *       "dataEnabled": "Data transfers are supported to this contact's country",
 *       "allDisabled": "Gifting is not available for this contact’s country. Check to be sure the country code (e.g. +53, +268, etc.) is correct."
 *     },
 *     "creditPackages":[
 *         {
 *             "packageId": "flom_tier_2",
 *             "value": 200
 *         }
 *     ],
 *     "limits": [
 *         {
 *             "lowerLimit": 0, // inclusive (>=0)
 *             "upperLimit": 200, // exclusive (<200)
 *             "emojiLink": "https://lorem.ipsum/dolor/sit-amet.webp"
 *         }
 *     ],
 *     "sprayValue": 10
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 4000007 Token not valid
 */

router.post("/", auth({ allowUser: true }), async (request, response) => {
  try {
    const user = request.user;
    const userId = user._id.toString();
    const userPhoneNumber = user.phoneNumber;
    const countryCode = Utils.getCountryCodeFromPhoneNumber({ phoneNumber: userPhoneNumber });
    const requestPhoneNumbers = request.body.phoneNumbers;

    const users = [],
      countries = [],
      flomUsersMap = [];
    let phoneNumbers = [];

    const limits = await getLimits();
    const creditPackages = await getCreditPackages(countryCode);

    const sprayValues = await SprayValue.find({
      countryCode: { $in: [countryCode, "default"] },
    }).lean();
    let sprayValue = null;

    if (sprayValues.length === 1) sprayValue = sprayValues[0].value;
    else
      sprayValue =
        sprayValues[0].countryCode === "default" ? sprayValues[1].value : sprayValues[0].value;

    if (requestPhoneNumbers) {
      function getPhoneNumbers(stringOfNumbers) {
        return stringOfNumbers
          .split(",")
          .map((n) => n.trim())
          .filter((e) => e.length > 7 && !e.startsWith("Deleted_user"));
      }

      phoneNumbers = getPhoneNumbers(requestPhoneNumbers);
      phoneNumbers.push(userPhoneNumber);
      phoneNumbers = Array.from(new Set(phoneNumbers));

      const getFlomUsersResult = await getFlomUsers({
        phoneNumbers,
        countryCode,
      });
      const flomUsers = getFlomUsersResult.flomUsers;
      flomUsersMap.push(...getFlomUsersResult.flomUsersMap);

      await syncContacts({ flomUsers, userId });

      users.push(
        ...flomUsers.map((user) => {
          const { _id, userName: username, ...rest } = user;
          const userData = { _id: _id.toString(), username, ...rest };
          if (userData?.avatar?.picture?.size) {
            userData.avatar.picture.size = Math.floor(userData.avatar.picture.size);
          }
          if (userData?.avatar?.thumbnail?.size) {
            userData.avatar.thumbnail.size = Math.floor(userData.avatar.thumbnail.size);
          }
          return userData;
        }),
      );
    } else {
      users.push(user);
      phoneNumbers.push(userPhoneNumber);
    }

    countries.push(
      ...(await getCountries({
        phoneNumbers,
        countryCode,
      })),
    );

    const transferTypesFromDB = await TransferType.find().lean();

    let { value: promoValue = 22 } = await Configuration.findOne({
      name: "mobileTransferScreenPercentageValue",
    }).lean();

    const percentageRegex = new RegExp("(\\d+(\\.\\d+)?|\\.\\d+) ?%");
    const transferTypes = transferTypesFromDB.map((type) => ({
      type: type.type,
      name: type.name,
      disabled: type.disabled,
      supportedCountries: type.supportedCountries,
      promoText: type.promoText?.replace(percentageRegex, `${promoValue}%`) || "",
    }));

    const paymentMethodsFromDB = await PaymentMethod.find({ disabled: false }).lean();

    let paymentMethods = paymentMethodsFromDB.map((paymentMethod) => ({
      type: paymentMethod.type,
      name: paymentMethod.name,
      disabled: paymentMethod.disabled,
      fee: paymentMethod.fee,
    }));

    paymentMethods.forEach((paymentMethod) => {
      paymentMethod.logoLink = `${Config.webClientUrl}/api/v2/payment-methods/logo/${paymentMethod.type}`;
      if (paymentMethod.type === Const.defaultPaymentMethodType) {
        paymentMethod.selected = true;
      } else {
        paymentMethod.selected = false;
      }
    });

    Base.successResponse(response, Const.responsecodeSucceed, {
      users,
      countries,
      transferTypes,
      paymentMethods,
      flomUsersMap,
      strings: Config.syncStrings,
      creditPackages,
      limits,
      sprayValue,
    });

    updateUsersBankAccounts({ user });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "App StartupController",
      error,
    });
  }
});

module.exports = router;
