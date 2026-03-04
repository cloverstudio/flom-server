"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { User } = require("#models");

/**
      * @api {post} /api/v2/user/mute mute / unmute
      * @apiName mute / unmute
      * @apiGroup WebAPI
      * @apiDescription mute / unmute
      * @apiHeader {String} access-token Users unique access-token.
 
      * @apiParam {String} action action
      * @apiParam {String} target target
      * @apiParam {String} type type
      
      * @apiSuccessExample Success-Response:
 {}
 
 **/

router.post("/", auth({ allowUser: true }), async function (request, response) {
  try {
    if (!request.body.action)
      return Base.successResponse(response, Const.responsecodeMuteWrongParam);

    if (!request.body.target)
      return Base.successResponse(response, Const.responsecodeMuteWrongParam);

    const action = request.body.action;
    const target = request.body.target.split(",").map((id) => {
      return id.trim();
    });
    let currentMuteList = request.user.muted;
    if (action == Const.muteActionUnmute) {
      currentMuteList = currentMuteList.filter((item) => !target.includes(item));
    } else if (action == Const.muteActionMute) {
      currentMuteList = Array.from(new Set([...currentMuteList, ...target]));
    } else {
      return Base.successResponse(response, Const.responsecodeMuteWrongParam);
    }

    await User.findByIdAndUpdate(request.user._id.toString(), { muted: currentMuteList });

    return Base.successResponse(response, Const.responsecodeSucceed);
  } catch (error) {
    return Base.errorResponse(response, Const.httpCodeServerError, "MuteController", error);
  }
});

module.exports = router;
