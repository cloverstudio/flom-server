"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, Config } = require("#config");
const { auth } = require("#middleware");
const { User } = require("#models");

router.patch("/remove-ban", auth({ allowUser: true }), async function (request, response) {
  try {
    if (Config.environment == "production") {
      return Base.successResponse(response, Const.responsecodeSucceed, {});
    }

    const { user } = request;

    await User.findByIdAndUpdate(user._id.toString(), {
      bannedFromAuctionsUntil: 0,
      failedAuctionPayments: 0,
    });

    const responseData = {};
    Base.successResponse(response, Const.responsecodeSucceed, responseData);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "RemoveAuctionBanController",
      error,
    });
  }
});

module.exports = router;
