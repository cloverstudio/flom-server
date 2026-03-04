"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { redis } = require("#infra");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { User } = require("#models");

/**
     * @api {post} /api/v2/user/signout SignOut
     * @apiName Signin
     * @apiGroup WebAPI
     * @apiDescription nothing
     * @apiSuccessExample Success-Response:
{
	code: 1,
	time: 1454417582385
}

    */

router.post("", auth({ allowUser: true }), async function (request, response) {
  try {
    const UUID = request.headers["uuid"];

    if (Config.forceLogoutAllDevice) {
      await User.findByIdAndUpdate(request.user._id.toString(), {
        token: [],
        pushToken: [],
        voipPushToken: [],
      });

      await redis.set(Const.redisKeyOnlineStatus + request.user._id.toString(), {
        lastSeenTimestamp: Date.now(),
      });
    } else if (UUID) {
      const user = await User.findById(request.user._id.toString()).lean();

      const deviceData = user.UUID.find((data) => data.UUID === UUID);

      if (deviceData) {
        const pushTokensToRemove = deviceData.pushTokens;
        const tokenToRemove = deviceData.lastToken;

        const updateTokens = user.token.filter((token) => token.token !== tokenToRemove);
        const updatePushTokens = user.pushToken.filter(
          (token) => !pushTokensToRemove.includes(token),
        );
        const updateVoipPushTokens = user.voipPushToken.filter(
          (token) => !pushTokensToRemove.includes(token),
        );

        await User.findByIdAndUpdate(request.user._id.toString(), {
          token: updateTokens,
          pushToken: updatePushTokens,
          voipPushToken: updateVoipPushTokens,
        });

        if (updateTokens.length === 0)
          await redis.set(Const.redisKeyOnlineStatus + request.user._id.toString(), {
            lastSeenTimestamp: Date.now(),
          });
      }
    } else {
      const currentAccessToken = request.headers["access-token"];

      const user = await User.findById(request.user._id.toString()).lean();
      const updateTokens = user.token.filter((token) => token.token !== currentAccessToken);

      await User.findByIdAndUpdate(request.user._id.toString(), {
        token: updateTokens,
      });

      if (updateTokens.length === 0)
        await redis.set(Const.redisKeyOnlineStatus + request.user._id.toString(), {
          lastSeenTimestamp: Date.now(),
        });
    }

    Utils.clearCookies(response, request.headers.origin);
    return Base.successResponse(response, Const.responsecodeSucceed, []);
  } catch (error) {
    return Base.errorResponse(response, Const.httpCodeServerError, "SignoutController", error);
  }
});

module.exports = router;
