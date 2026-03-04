"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { Favorite } = require("#models");

/**
     * @api {post} /api/v2/message/favorite/remove RemoveFromFavorite
     * @apiName RemoveFromFavorite
     * @apiGroup WebAPI
     * @apiDescription Remove from favorite
     * @apiHeader {String} access-token Users unique access-token.
     * @apiParam {string} messageId messageId
     * @apiSuccessExample Success-Response:
{
	"code": 1,
	"time": 1457363319718
}

**/

router.post("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const messageId = request.body.messageId;

    if (!messageId) {
      return Base.successResponse(response, Const.responsecodeRemoveFromFavoriteNoMessageId);
    }

    const exists = await Favorite.findOne({
      userId: request.user._id,
      messageId: messageId,
    });

    if (!exists) {
      return Base.successResponse(response, Const.responsecodeRemoveFromFavoriteInvalidMessageId);
    }

    await Favorite.deleteMany({ _id: exists.id });

    return Base.successResponse(response, Const.responsecodeSucceed);
  } catch (error) {
    return Base.errorResponse(
      response,
      Const.httpCodeServerError,
      "RemoveFromFavoriteController",
      error,
    );
  }
});

module.exports = router;
