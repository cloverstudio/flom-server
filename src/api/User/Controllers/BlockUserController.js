"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { User, LiveStream } = require("#models");

/**
     * @api {post} /api/v2/user/block Block/Unblock user
     * @apiName Block
     * @apiGroup WebAPI
     * @apiDescription Block/Unblock user
     * @apiHeader {String} access-token Users unique access-token.
     * @apiParam {string} action action
     * @apiParam {string} target target
     
     * @apiSuccessExample Success-Response:
{}

**/

router.post("/", auth({ allowUser: true }), async (request, response) => {
  try {
    const userId = request.user._id.toString();
    const { action, target } = request.body;

    if (!action) {
      logger.error("BlockUserController, action missing");
      Base.successResponse(response, Const.responsecodeBlockWrongParam);
      return;
    }

    if (!target) {
      logger.error("BlockUserController, target missing");
      Base.successResponse(response, Const.responsecodeBlockWrongParam);
      return;
    }

    let messageType = "";
    if (action == Const.blockActionBlock) {
      messageType = "blockUser";
      await User.findByIdAndUpdate(userId, { $addToSet: { blocked: target } });
    } else if (action == Const.blockActionUnblock) {
      messageType = "unblockUser";
      await User.findByIdAndUpdate(userId, { $pull: { blocked: target } });
    }

    const liveStream = (
      await LiveStream.find({ isActive: true, userId }, null, {
        lean: true,
        sort: { created: -1 },
        limit: 1,
      })
    )[0];
    if (liveStream) {
      await Utils.sendMessageToLiveStream({
        liveStream,
        data: { messageType, liveStreamId: liveStream._id.toString(), blockedUserId: target },
      });
    }

    Base.successResponse(response, Const.responsecodeSucceed);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "BlockUserController",
      error,
    });
  }
});

module.exports = router;
