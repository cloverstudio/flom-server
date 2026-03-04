"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, Config } = require("#config");
const { auth } = require("#middleware");
const { sendMessage } = require("#logics");
const { createOfferMessage } = require("../helpers");
const mediaHandler = require("#media");

/**
 * @api {post} /api/v2/message/send Send Message
 * @apiName Send Message
 * @apiGroup WebAPI Message
 * @apiDescription Returns messageobj
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {String} roomID roomID
 * @apiParam {String} message message
 * @apiParam {String} type message type
 * @apiParam {String} file.file file( if exists)
 * @apiParam {String} file.thumb thumb ( if picture )
 *
 * @apiSampleRequest
 * {
 *   "file": {
 *     "file": {
 *       "size": "1504586",
 *       "name": "test.jpg",
 *       "mimeType": "image/jpeg",
 *       "id": "5730a5edf5c6e3123d09c85f"
 *     },
 *     "thumb": {
 *       "size": "33000",
 *       "name": "thumb_2014-06-03 17.23.39.jpg\"",
 *       "mimeType": "image/jpeg",
 *       "id": "5730a5eef5c6e3123d09c860"
 *     }
 *   },
 *   "roomID": "1-56ec126ca4718ef424641692-572b3fdd52ae03995757478e",
 *   "type": "2"
 * }
 *
 * @apiSuccessExample Success-Response:
 * {
 * 	"code": 1,
 * 	"time": 1462805270534,
 * 	"data": {
 * 		"message": {
 * 			"__v": 0,
 * 			"user": "56ec127aa4718ef424641693",
 * 			"userID": "56ec126ca4718ef424641692",
 * 			"roomID": "1-56ec126ca4718ef424641692-572b3fdd52ae03995757478e",
 * 			"message": "test",
 * 			"type": 1,
 * 			"created": 1462805270529,
 * 			"_id": "5730a316cce6a28d3afd8eee",
 * 			"seenBy": []
 * 		}
 * 	}
 * }
 */

router.post("/", auth({ allowUser: true }), async function (request, response) {
  try {
    request.body.encrypted = true;
    request.body.userID = request.user._id.toString();

    const isOffer = request.body.isOffer;

    if (!!isOffer && !request.body.roomID) {
      const { productId, offer, quantity } = request.body;
      const message = await createOfferMessage({
        user: request.user,
        productId,
        offer,
        quantity,
      });

      request.body = { ...message, userID: request.user._id.toString(), encrypted: true };
    }

    try {
      if (
        request.body.type === Const.messageTypeGif &&
        !!+request.body.attributes?.gifData?.superBless
      ) {
        const { emojiFileName } = request.body.attributes.gifData;
        const { width, height } = await mediaHandler.getImageInfo(
          `${Config.uploadPath}/flomojis/${emojiFileName}`,
        );
        request.body.attributes.gifData.height = height;
        request.body.attributes.gifData.width = width;
      }
    } catch (error) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeFailedToSendMessage,
        message: `SendMessageController, error in getting gif dimensions`,
      });
    }

    let result;
    try {
      result = await sendMessage(request.body);
    } catch (error) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeFailedToSendMessage,
        message: `SendMessageController, error on sending message`,
      });
    }

    return Base.successResponse(response, Const.responsecodeSucceed, {
      message: result.origMessageObj,
    });
  } catch (error) {
    return Base.errorResponse(response, Const.httpCodeServerError, "SendMessageController", error);
  }
});

module.exports = router;
