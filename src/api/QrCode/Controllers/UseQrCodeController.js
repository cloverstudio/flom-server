"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { redis } = require("#infra");
const { Const } = require("#config");
const { auth } = require("#middleware");

/**
      * @api {post} /api/v2/qrcode/use Use QR code
      * @apiName Get Dictionary
      * @apiGroup WebAPI
      * @apiDescription get yq code unique string
      * @apiSuccessExample Success-Response:
 {}
 **/

router.post("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const code = request.body.code;

    const value = await redis.get(Const.redisKeyQrCode + code);
    if (value) {
      console.log("Use QR Code Controller, entered if");
      value.userId = request.user._id.toString();
      await redis.set(Const.redisKeyQrCode + code, value);
    }

    Base.successResponse(response, Const.responsecodeSucceed);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "UseQrCodeController",
      error,
    });
  }
});

module.exports = router;
