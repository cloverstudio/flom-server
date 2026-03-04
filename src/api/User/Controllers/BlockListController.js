"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { User } = require("#models");

/**
     * @api {get} /api/v2/user/blocklist BlockList
     * @apiName BlockList
     * @apiGroup WebAPI
     * @apiDescription Returns nothing
     * @apiHeader {String} access-token Users unique access-token.
     * @apiSuccessExample Success-Response:
{}

**/

router.get("/", auth({ allowUser: true }), async (request, response) => {
  try {
    const { user } = request;

    const blockedUsers =
      !user.blocked || user.blocked.length === 0
        ? []
        : await User.find({ _id: { $in: user.blocked } }).lean();

    Base.successResponse(response, Const.responsecodeSucceed, { list: blockedUsers });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "BlockListController",
      error,
    });
  }
});

module.exports = router;
