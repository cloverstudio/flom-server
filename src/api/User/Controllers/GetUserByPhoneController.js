"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { User } = require("#models");

/**
     * @api {post} /api/v2/user/getUserByPhone Get User By Phone
     * @apiName Get user by phone
     * @apiGroup WebAPI
     * @apiDescription Get User By Phone
     * 
     * @apiHeader {String} access-token Users unique access-token.
     * 
     * @apiParam {String} phoneNumber phoneNumber
     * @apiSuccessExample Success-Response:
    {
    "code": 1,
    "time": 1565266185583,
    "data": {
        "token": [
            {
                "token": "*****",
                "generateAt": 1558964696323
            }
        ],
        "pushToken": [
            "du1o1CXpAJE:APA91bGKCIuunIwdr8Lnxo_ueLTwJvXmsYQiPHfj8h3H3BklsVb8_B7LIfwjoByugIG0S7X2oPTMuLunevwzKqMPD1OkaReUMU93dX6G9SPjhd83TraCDvluhdC0pdNsix2vCIousH8i"
        ],
        "webPushSubscription": [],
        "voipPushToken": [],
        "groups": [
            "5caf311bec0abb18999bd755"
        ],
        "muted": [],
        "blocked": [],
        "devices": [],
        "UUID": [
            {
                "UUID": "0f0a5cae164bbd1a",
                "lastLogin": 1558964696323,
                "blocked": null,
                "lastToken": [],
                "pushTokens": [
                    "du1o1CXpAJE:APA91bGKCIuunIwdr8Lnxo_ueLTwJvXmsYQiPHfj8h3H3BklsVb8_B7LIfwjoByugIG0S7X2oPTMuLunevwzKqMPD1OkaReUMU93dX6G9SPjhd83TraCDvluhdC0pdNsix2vCIousH8i"
                ]
            }
        ],
        "bankAccounts": [],
        "location": {
            "type": "Point",
            "coordinates": [
                1,
                2
            ]
        },
        "locationVisibility": false,
        "isAppUser": true,
        "flomAgentId": null,
        "newUserNotificationSent": false,
        "followedBusinesses": [],
        "likedProducts": [],
        "_id": "5cebe99e0ba5bd4eecd6fb71",
        "name": "Osagie",
        "organizationId": "5caf3119ec0abb18999bd753",
        "status": 1,
        "created": 1558964638196,
        "phoneNumber": "+2348055572464",
        "activationCode": null,
        "__v": 1,
        "typeAcc": 2,
        "description": ""
    }
}
     */

router.post("/", auth({ allowUser: true }), async function (request, response) {
  const phoneNumber = request.body.phoneNumber;

  if (!phoneNumber) return Base.successResponse(response, Const.responsecodeNoPhoneNumber);

  if (!phoneNumber.startsWith("+"))
    return Base.successResponse(response, Const.responsecodeWrongPhoneNumberFormat);

  try {
    let user = await User.findOne({
      phoneNumber: phoneNumber,
      organizationId: request.user.organizationId,
      status: 1,
      isAppUser: true,
    });

    if (!user) return Base.successResponse(response, Const.responsecodePhoneNumberNotFound);

    user = user.toObject();
    // user.nigerianBankAccounts.forEach((bankAccount) => {
    //   if (bankAccount.logoFileName?.length > 0) {
    //     //const filePath = Config.paymentMethodLogoPath + "/" + bankAccount.logoFileName;
    //     bankAccount.logoUrl = `${Config.webClientUrl}/api/v2/payment-methods/get-logo/${bankAccount.logoFileName}`;
    //   } else {
    //     bankAccount.logoUrl = `${Config.webClientUrl}/api/v2/payment-methods/get-logo/payment-1.png`;
    //   }
    //   delete bankAccount.logoFileName;
    // });
    let result = {};
    result.user = user;

    return Base.successResponse(response, Const.responsecodeSucceed, result);
  } catch (e) {
    Base.errorResponse(response, Const.httpCodeServerError, "GetUserByPhoneController", e);
    return;
  }
});

module.exports = router;
