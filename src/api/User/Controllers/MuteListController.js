"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { User, Group, Room } = require("#models");

/**
     * @api {get} /api/v2/user/mutelist MuteList
     * @apiName MuteList
     * @apiGroup WebAPI
     * @apiDescription Returns nothing
     * @apiHeader {String} access-token Users unique access-token.
     * @apiSuccessExample Success-Response:
{}

**/

router.get("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const user = request.user;
    const muteList = user.muted || [];

    const users =
      !muteList || muteList.length === 0
        ? []
        : (await User.find({ _id: { $in: muteList } }).lean()) ?? [];
    const groups =
      !muteList || muteList.length === 0
        ? []
        : (await Group.find({ _id: { $in: muteList } }).lean()) ?? [];
    const rooms =
      !muteList || muteList.length === 0
        ? []
        : (await Room.find({ _id: { $in: muteList } }).lean()) ?? [];

    return Base.successResponse(response, Const.responsecodeSucceed, { users, groups, rooms });
  } catch (error) {
    return Base.errorResponse(response, Const.httpCodeServerError, "MuteListController", error);
  }
});

module.exports = router;
