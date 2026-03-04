"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { Favorite, Message } = require("#models");

/**
      * @api {post} /api/v2/message/favorite/add AddToFavorite
      * @apiName AddToFavorite
      * @apiGroup WebAPI
      * @apiDescription Add to callers favorite
      * @apiHeader {String} access-token Users unique access-token.
      * @apiParam {string} messageId messageId
      * @apiSuccessExample Success-Response:
 {
     "code": 1,
     "time": 1457363319718,
     "data": {
         "favorite": {
             "__v": 0,
             "userId": "56c32acd331dd81f8134f200",
             "messageId": "56dd9527f3e5890d4700b9e6",
             "created": 1457363319710,
             "_id": "56dd9977ee7b28114fa651e6"
         }
     }
 }
 
 **/

router.post("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const messageId = request.body.messageId;

    if (!messageId) {
      return Base.successResponse(response, Const.responsecodeAddToFavoriteNoMessageId);
    }

    const message = await Message.findById(messageId).lean();

    if (!message) {
      return Base.successResponse(response, Const.responsecodeAddToFavoriteInvalidMessageId);
    }

    const existedFavorite = await Favorite.findOne({
      userId: request.user._id.toString(),
      messageId: messageId,
    }).lean();

    if (existedFavorite) {
      return Base.successResponse(response, Const.responsecodeAddToFavoriteExistedMessageId);
    }

    const favorite = await Favorite.create({
      userId: request.user._id.toString(),
      messageId: messageId,
      roomId: message.roomID,
      created: Date.now(),
    });

    return Base.successResponse(response, Const.responsecodeSucceed, {
      favorite: favorite.toObject(),
    });
  } catch (error) {
    return Base.errorResponse(
      response,
      Const.httpCodeServerError,
      "AddToFavoriteController",
      error,
    );
  }
});

module.exports = router;
