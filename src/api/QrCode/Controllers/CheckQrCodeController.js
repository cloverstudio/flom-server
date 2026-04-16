"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { redis } = require("#infra");
const { Const } = require("#config");
const { User } = require("#models");

/**
      * @api {get} /api/v2/qrcode/check User QR code
      * @apiName Get Dictionary
      * @apiGroup WebAPI
      * @apiDescription get yq code unique string
      * @apiSuccessExample Success-Response:
 {}
 **/

router.get("/:code", async function (request, response) {
  try {
    const code = request.params.code;

    const value = await redis.get(Const.redisKeyQrCode + code);

    if (!value || !value.userId) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNotFound,
        type: Const.logTypeLogin,
        message: `CheckQrCodeController, user not found`,
      });
    }

    const user = await User.findById(value.userId);
    if (!user) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNotFound,
        type: Const.logTypeLogin,
        message: `CheckQrCodeController, user not found`,
      });
    }

    if (user?.isDeleted?.value) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserDeleted,
        type: Const.logTypeLogin,
        message: `CheckQrCodeController, user deleted`,
      });
    }

    if (!user.deviceType) {
      user.deviceType = value.deviceType;
    }

    user.hasLoggedIn = Const.userLoggedInAtLeastOnce;

    if (!user.firstLogin && user.lastLogin) {
      user.firstLogin = 1;
    } else if (!user.firstLogin) {
      user.firstLogin = Date.now();
    }
    user.lastLogin = Date.now();
    user.loginCount = !user.loginCount ? 1 : user.loginCount + 1;

    user.save();

    await redis.del(Const.redisKeyQrCode + code);

    Base.successResponse(response, Const.responsecodeSucceed, {
      userId: value.userId,
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "CheckQrCodeController",
      error,
    });
  }
});

module.exports = router;
