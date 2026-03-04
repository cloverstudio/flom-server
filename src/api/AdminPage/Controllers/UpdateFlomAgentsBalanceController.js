"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Config, Const } = require("#config");
const { auth } = require("#middleware");
const { User } = require("#models");

/**
 * @api {post} /api/v2/admin-page/update-agent Update Flom agents credit balance flom_v1
 * @apiVersion 2.0.12
 * @apiName Update Flom agents credit balance flom_v1
 * @apiGroup WebAPI Admin page
 * @apiDescription Update Flom agent's credit balance
 *
 * @apiHeader {String} access-token Users unique access-token. Only super-admin token allowed.
 *
 * @apiParam {Number}   creditsAmount   Amount of credits to add to Flom agent's credit balance
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1673438532016,
 *     "data": {
 *         "updatedFlomAgent": {
 *             "token": [],
 *             "pushToken": [],
 *             "webPushSubscription": [],
 *             "voipPushToken": [],
 *             "groups": [
 *                 "5caf311bec0abb18999bd755"
 *             ],
 *             "muted": [],
 *             "blocked": [],
 *             "devices": [],
 *             "UUID": [],
 *             "bankAccounts": [],
 *             "location": {
 *                 "type": "Point",
 *                 "coordinates": [
 *                     0,
 *                     0
 *                 ]
 *             },
 *             "isAppUser": true,
 *             "flomAgentId": null,
 *             "newUserNotificationSent": true,
 *             "followedBusinesses": [],
 *             "likedProducts": [],
 *             "recentlyViewedProducts": [],
 *             "createdBusinessInFlom": false,
 *             "onAnotherDevice": true,
 *             "shadow": false,
 *             "isDeleted": {
 *                 "value": false,
 *                 "created": 1659622064333
 *             },
 *             "featuredProductTypes": [],
 *             "blockedProducts": 0,
 *             "memberships": [],
 *             "socialMedia": [],
 *             "isCreator": false,
 *             "isSeller": true,
 *             "notifications": {
 *                 "timestamp": 0,
 *                 "unreadCount": 1
 *             },
 *             "phoneNumberStatus": 1,
 *             "payoutFrequency": 5,
 *             "lastPayoutDate": 0,
 *             "merchantApplicationStatus": null,
 *             "locationVisibility": false,
 *             "creditBalance": 100,
 *             "_id": "5e08f8029d384b04a30b23aa",
 *             "name": "FLOM",
 *             "organizationId": "5caf3119ec0abb18999bd753",
 *             "status": 1,
 *             "created": 1577646082267,
 *             "phoneNumber": "+2347057091036",
 *             "typeAcc": 2,
 *             "__v": 21,
 *             "activationCode": null,
 *             "description": "",
 *             "userName": "FLOM",
 *             "invitationUri": "https://qrios.page.link/s5e5FnHPx9nX8bVW7",
 *             "cover": {
 *                 "banner": {
 *                     "file": {
 *                         "originalName": "1 874.png",
 *                         "nameOnServer": "defaultBanner",
 *                         "size": 70369,
 *                         "mimeType": "image/png",
 *                         "aspectRatio": 3.13044
 *                     },
 *                     "fileType": 0,
 *                     "thumb": {
 *                         "originalName": "1 874.png",
 *                         "nameOnServer": "defaultBannerThumb",
 *                         "mimeType": "image/jpeg",
 *                         "size": 174000
 *                     }
 *                 }
 *             },
 *             "permission": 2
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
 * @apiError (Errors) 4000007 Token not valid
 */

router.post(
  "/",
  auth({ allowAdmin: true, role: Const.Role.SUPER_ADMIN }),
  async function (request, response) {
    try {
      const { creditsAmount } = request.body;
      const flomAgentId = Config.flomSupportUserId;

      const updatedFlomAgent = await User.findOneAndUpdate(
        { _id: flomAgentId },
        { $inc: { creditBalance: creditsAmount } },
        { new: true },
      );

      Base.successResponse(response, Const.responsecodeSucceed, {
        updatedFlomAgent: !updatedFlomAgent ? {} : updatedFlomAgent.toObject(),
      });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "UpdateFlomAgentsBalanceController",
        error,
      });
    }
  },
);

module.exports = router;
