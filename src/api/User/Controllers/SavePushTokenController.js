"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { User } = require("#models");
const { updateUsersPushToken } = require("#logics");

/**
      * @api {post} /api/v2/user/savepushtoken SavePushToken
      * @apiName SavePushToken
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
             pushToken : ["test","test1"]
         }
     }
 }
 
     */

router.post("", auth({ allowUser: true }), async function (request, response) {
  try {
    if (!request.body.pushToken) {
      return Base.successResponse(response, Const.responsecodeSavePushTokenWrongToken);
    }

    let user = request.user;

    if (user.pushToken && user.pushToken.includes(request.body.pushToken)) {
      return Base.successResponse(response, Const.responsecodeSucceed);
    }

    await updateUsersPushToken(request.body.pushToken, user._id.toString(), false);

    if (!user.pushToken.includes(request.body.pushToken)) {
      user.pushToken.push(request.body.pushToken);
    }

    const UUID = request.headers["uuid"];
    const newPushToken = request.body.pushToken;
    const savedUUIDs = user.UUID;
    let changed = false;

    if (UUID && newPushToken && savedUUIDs) {
      savedUUIDs.forEach((o) => {
        if (o.UUID == UUID) {
          if (!o.pushTokens) {
            o.pushTokens = [];
          }

          if (o.pushTokens.indexOf(newPushToken) == -1) {
            o.pushTokens.push(newPushToken);
            o.lastUpdate = Date.now();
            changed = true;
          }
        }
      });
    }

    if (changed) {
      user = await User.findByIdAndUpdate(
        user._id.toString(),
        { UUID: savedUUIDs },
        { new: true, lean: true },
      );
    }

    return Base.successResponse(response, Const.responsecodeSucceed, { user });
  } catch (error) {
    return Base.errorResponse(
      response,
      Const.httpCodeServerError,
      "SavePushTokenController",
      error,
    );
  }
});

module.exports = router;
