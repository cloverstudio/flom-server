"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { User } = require("#models");

/**
      * @api {post} /api/v2/user/savewebpushsubscription SavePushToken
      * @apiName SaveWebPushSubscription
      * @apiGroup WebAPI
      * @apiDescription Save push token to user model
      * @apiHeader {String} access-token Users unique access-token.
      *   
      * @apiParam {String} pushToken pushToken for push notification service
      * 
      * @apiSuccessExample Success-Response:
 {
     code: 1,
     time: 1454417582385,
     data: {
         user: {
             _id: '56b0a6ae6753ea416ad58ea9',
             name: 'user1',
             userid: 'userid1ixfQJ',
             password: '*****',
             created: 1454417582354,
             __v: 0,
             token: '*****',
             tokenGeneratedAt: 1454417582384,
             webpushsubscription : [{
                 endpoint: String,
                 keys: {}
             }]
         }
     }
 }
 
     */

router.post("", auth({ allowUser: true }), async function (request, response) {
  try {
    if (!request.body.pushSubscription) {
      return Base.successResponse(response, Const.responsecodeSavePushTokenWrongToken);
    }

    const user = request.user;

    const newPushSubscription = request.body.pushSubscription;
    const savedPushSubscriptions = user.webPushSubscription || [];

    if (
      !savedPushSubscriptions.find(
        (subscription) => subscription.endpoint === newPushSubscription.endpoint,
      )
    ) {
      savedPushSubscriptions.push(newPushSubscription);

      await User.findByIdAndUpdate(user._id.toString(), {
        webPushSubscription: savedPushSubscriptions,
      });

      user.webPushSubscription = savedPushSubscriptions;
    }

    return Base.successResponse(response, Const.responsecodeSucceed, { user });
  } catch (error) {
    return Base.errorResponse(
      response,
      Const.httpCodeServerError,
      "SaveWebPushSubscriptionController",
      error,
    );
  }
});

module.exports = router;
