"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { User, Product } = require("#models");

/**
   api docs...
   */

router.get("/", async function (request, response) {
  try {
    const phoneNumber = request.query.phoneNumber;

    const user = await User.findOne({ "deletedUserInfo.phoneNumber": "+" + phoneNumber }).lean();

    if (!user) {
      return Base.newErrorResponse({
        response,
        message: "RevertUserController - deleted user not found in database",
        code: Const.responsecodeUserNotFound,
      });
    }

    await User.updateOne(
      { _id: user._id.toString() },
      {
        $set: {
          isDeleted: { value: false, created: Date.now() },
          phoneNumber: user.deletedUserInfo.phoneNumber,
          userName: user.deletedUserInfo.userName ?? "",
          name: user.deletedUserInfo.name ?? "",
          bankAccounts: user.deletedUserInfo.bankAccounts ?? [],
        },
        $unset: { deletedUserInfo: 1 },
      },
    );

    await Product.updateMany({ ownerId: user?._id.toString() }, { $set: { isDeleted: false } });

    Base.successResponse(response, Const.responsecodeSucceed);
  } catch (e) {
    return Base.newErrorResponse({
      response,
      message: "RevertUserController",
      error: e,
    });
  }
});

module.exports = router;
