"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { EmojiSet, User } = require("#models");

/**
 * @api {get} /api/v2/emoji-set/search/:setId  Search emojis in emoji set
 * @apiVersion 0.0.1
 * @apiName  Add emoji to emoji set
 * @apiGroup WebAPI Emoji Set
 * @apiDescription API that can be used to search emojis by its name.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam (Query string) {String} [name] String that represents part of or full name of emoji. Minimum length is 2 characters.
 * @apiParam (Query string) {String} [emojiCount] Maximum number of emojis to return (default 20)
 *
 * @apiSuccessExample Success-Response:
 * {
 *     "code": 1,
 *     "time": 1677063760261,
 *     "data": {
 *         "emojis": [
 *             {
 *                 "bigImage": {
 *                     "originalFileName": "4.webp",
 *                     "nameOnServer": "0QaaLW2fbq3HoIfrjdALFAQxraXIWd19.webp",
 *                     "mimeType": "image/webp",
 *                     "height": 772,
 *                     "width": 1024,
 *                     "aspectRatio": 0.75390625
 *                 },
 *                 "smallImage": {
 *                     "originalFileName": "4.webp",
 *                     "nameOnServer": "YwEwamooKg1XQ9Ufg0MruzudeiGWD3mP.webp",
 *                     "mimeType": "image/webp",
 *                     "height": 772,
 *                     "width": 1024,
 *                     "aspectRatio": 0.75390625
 *                 },
 *                 "created": 1675794641268,
 *                 "modified": 1676280940167,
 *                 "_id": "63e298d12a439852f927d405",
 *                 "name": "test edit 1",
 *                 "animate": false,
 *                 "isDeprecated": false
 *             },
 * 						.
 * 						.
 * 						.
 *         ]
 *     }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 4000007 Token not valid
 * @apiError (Errors) 443792 No emoji set id
 * @apiError (Errors) 443791 Not valid emoji set id
 **/

router.get("/:setId", auth({ allowUser: true }), async function (request, response) {
  try {
    const token = request.headers["access-token"];
    var name = request.query.name || "";
    const emojiSetId = request.params.setId;
    const emojiCount = +request.query.emojiCount || 20;

    if (name.length < 2) {
      return Base.successResponse(response, Const.responsecodeSucceed, {
        emojis: [],
      });
    }

    if (!emojiSetId) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoEmojiSetId,
        message: "SearchEmojiInSetController - no emoji set id",
      });
    }

    const emojiSet = await EmojiSet.findOne({ _id: emojiSetId, isDeprecated: false }).lean();

    if (!emojiSet) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNotValidEmojiSetId,
        message: "SearchEmojiInSetController - not valid emoji set id",
      });
    }

    const user = await User.find({ "token.token": token }).lean();

    if (!user) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeSigninInvalidToken,
        message: "SearchEmojiInSetController, invalid user token",
      });
    }

    let emojis = await EmojiSet.findOne(
      { _id: emojiSetId, isDeprecated: false },
      { items: 1, _id: 0 },
    ).lean();

    let emojisFiltered = emojis.items.filter((emoji) => {
      if (emoji.name.startsWith(name.toLowerCase()) && emoji.isDeprecated === false) {
        return true;
      }
      return false;
    });

    Base.successResponse(response, Const.responsecodeSucceed, {
      emojis: emojisFiltered.slice(0, emojiCount),
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "SearchEmojiInSetController",
      error,
    });
  }
});

module.exports = router;
