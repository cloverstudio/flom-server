"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { User } = require("#models");

/**
 * @api {get} /api/v2/users/merchant-code/:merchantCode New get user by merchant code
 * @apiVersion 2.0.9
 * @apiName  New get user by merchant code
 * @apiGroup WebAPI User
 * @apiDescription New get user by merchant code for flom_v1. Unlike the previous API this one will return all user merchant codes
 *
 * @apiHeader {String} access-token Users unique access-token
 *
 * @apiParam {String} merchantCode Users merchant code
 *
 * @apiSuccessExample Success Response
 * {
 *   "code": 1,
 *   "time": 1637328243577,
 *   "data": {
 *     "user": {
 *       "_id": "5f7ee464a283bc433d9d722f",
 *       "pushToken": [
 *         "dr4xyRa2QJuSFSc4178DOI:APA91bF7l4YRCMk9TgOZf5znMn6Ap"
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
 *           "UUID": "11956641d82031c4",
 *           "lastLogin": 1634214060275,
 *           "blocked": null,
 *           "lastToken": [
 *             {
 *               "token": "*****",
 *               "generateAt": 1633523168410,
 *               "isWebClient": false
 *             }
 *           ],
 *           "pushTokens": [
 *             "dr4xyRa2QJuSFSc4178DOI:APA91bF7l4YRCMk9TgOZf5znMn6Ap"
 *           ]
 *         }
 *       ],
 *       "bankAccounts": [
 *         {
 *           "_id": "616820ace4db98427e4dde1e",
 *           "merchantCode": "40200168",
 *           "name": "SampleAcc",
 *           "accountNumber": "1503567574679",
 *           "code": "",
 *           "selected": true
 *         },
 *         {
 *           "_id": "618bd3d79c203db6253f5d25",
 *           "merchantCode": "14719339",
 *           "name": "FakeGeneratedAcc",
 *           "accountNumber": "1503567574679",
 *           "code": "",
 *           "selected": false
 *         },
 *         {
 *           "_id": "618bd40bc06ae4b6f47f3718",
 *           "merchantCode": "16525948",
 *           "name": "FakeGeneratedAcc",
 *           "accountNumber": "555555555",
 *           "code": "",
 *           "selected": false
 *         },
 *         {
 *           "_id": "618d0e4aaefc5aa828506e38",
 *           "merchantCode": "13728215",
 *           "name": "FakeGeneratedAcc",
 *           "accountNumber": "86787645",
 *           "code": "",
 *           "selected": false
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
 *       "flomAgentId": null,
 *       "newUserNotificationSent": true,
 *       "followedBusinesses": [
 *         "6008f4f52639cf0b1829dd49",
 *         "601133dd1a1e9d092660c499",
 *         "60e4384b560d1466637e3eca",
 *         "6139cd7848c6c40f4dffb04a"
 *       ],
 *       "likedProducts": [
 *         "5f4f5ab618f352279ef2a82d"
 *       ],
 *       "createdBusinessInFlom": false,
 *       "onAnotherDevice": true,
 *       "shadow": false,
 *       "name": "Marko",
 *       "organizationId": "5caf3119ec0abb18999bd753",
 *       "status": 1,
 *       "created": 1602151524372,
 *       "phoneNumber": "+2348020000007",
 *       "userName": "mdragic",
 *       "invitationUri": "https://flom.page.link/wnLdbuLTY4qfhbqo9",
 *       "avatar": {
 *         "picture": {
 *           "originalName": "cropped2444207444774310745.jpg",
 *           "size": 4698848,
 *           "mimeType": "image/png",
 *           "nameOnServer": "profile-3XFUoWqVRofEPbMfC1ZKIDNj"
 *         },
 *         "thumbnail": {
 *           "originalName": "cropped2444207444774310745.jpg",
 *           "size": 97900,
 *           "mimeType": "image/png",
 *           "nameOnServer": "thumb-wDIl52eluinZOQ20yNn2PpnMwi"
 *         }
 *       },
 *       "description": "Don't steal my account!",
 *       "activationCode": null,
 *       "typeAcc": 1,
 *       "email": "marko.d@clover.studio",
 *       "recentlyViewedProducts": [
 *         "5f158464552d4627382e297b"
 *       ],
 *       "featuredProductTypes": [
 *         1,
 *         2
 *       ],
 *       "blockedProducts": 0,
 *       "cover": {},
 *       "memberships": [],
 *       "socialMedia": [
 *         {
 *           "type": 5,
 *           "username": "gidra"
 *         },
 *         {
 *           "type": 8,
 *           "username": "SnapKing"
 *         }
 *       ],
 *       "isCreator": true,
 *       "isSeller": true,
 *       "giveInvitePromotion": false,
 *       "notifications": {
 *         "unreadCount": 2,
 *         "timestamp": 1636451625004
 *       }
 *     }
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 400261 Invalid merchant code
 * @apiError (Errors) 4000007 Token not valid
 * @apiError (Errors) 4000760 No user found
 */

router.get("/:merchantCode", auth({ allowUser: true }), async (request, response) => {
  try {
    const { merchantCode } = request.params;
    const numberReqExp = RegExp("^[0-9]*$");

    if (!numberReqExp.test(merchantCode) || merchantCode.length !== 8) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidMerchantCode,
        message: `newGetUserByMerchantCodeController, invalid merchantCode`,
      });
    }

    const user = await User.findOne({ "bankAccounts.merchantCode": merchantCode }).lean();

    if (!user) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNotFound,
        message: `newGetUserByMerchantCodeController, no user found`,
      });
    }

    delete user.__v;
    delete user.token;

    Base.successResponse(response, Const.responsecodeSucceed, {
      user,
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "newGetUserByMerchantCodeController",
      error,
    });
  }
});

module.exports = router;
