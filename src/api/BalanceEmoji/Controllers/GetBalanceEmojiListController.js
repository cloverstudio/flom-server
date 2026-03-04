"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, Config } = require("#config");
const { auth } = require("#middleware");
const { BalanceEmoji } = require("#models");

/**
 * @api {get} /api/v2/balance-emoji Get balance emoji list flom_v1
 * @apiVersion 2.0.10
 * @apiName  Get balance emoji list flom_v1
 * @apiGroup WebAPI Balance Emoji
 * @apiDescription  API which is called to get a list of balance emojis
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1660732536009,
 *     "data": {
 *         "balanceEmojiList": [
 *             {
 *                 "emoji": {
 *                     "originalFileName": "logo_liquid-60.webp",
 *                     "nameOnServer": "RBhcSiCoQf5nDGKYttB55zKmUlw8KHb9.webp",
 *                     "mimeType": "image/webp",
 *                     "size": 15710,
 *                     "height": 284,
 *                     "width": 475
 *                 },
 *                 "limit": 100,
 *                 "created": 1660731586634,
 *                 "_id": "62fcc0c587a6c234704ff574",
 *                 "link": "https://dev-old.flom.app/uploads/balance-emojis/RBhcSiCoQf5nDGKYttB55zKmUlw8KHb9.webp"
 *             },
 *             {
 *                 "emoji": {
 *                     "originalFileName": "logo_liquid-60.webp",
 *                     "nameOnServer": "RBhcSiCoQf5nDGKYttB55zKmUlw8KHb9.webp",
 *                     "mimeType": "image/webp",
 *                     "size": 15710,
 *                     "height": 284,
 *                     "width": 475
 *                 },
 *                 "limit": 400,
 *                 "created": 1660731586635,
 *                 "_id": "62fcc0c587a6c234704ff575",
 *                 "link": "https://dev-old.flom.app/uploads/balance-emojis/RBhcSiCoQf5nDGKYttB55zKmUlw8KHb9.webp"
 *             },
 *             {
 *                 "emoji": {
 *                     "originalFileName": "logo_liquid-60.webp",
 *                     "nameOnServer": "RBhcSiCoQf5nDGKYttB55zKmUlw8KHb9.webp",
 *                     "mimeType": "image/webp",
 *                     "size": 15710,
 *                     "height": 284,
 *                     "width": 475
 *                 },
 *                 "limit": 800,
 *                 "created": 1660731586636,
 *                 "_id": "62fcc0c587a6c234704ff576",
 *                 "link": "https://dev-old.flom.app/uploads/balance-emojis/RBhcSiCoQf5nDGKYttB55zKmUlw8KHb9.webp"
 *             }
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
 * @apiError (Errors) 4000007 Token invalid
 */

router.get("/", auth({ allowAdmin: true, role: Const.Role.ADMIN }), async (request, response) => {
  try {
    const balanceEmojiList = await BalanceEmoji.find().sort({ limit: 1 }).lean();

    if (!balanceEmojiList || balanceEmojiList.length === 0) {
      return Base.successResponse(response, Const.responsecodeSucceed, {
        balanceEmojiList: [],
      });
    }

    balanceEmojiList.forEach((balanceEmoji) => {
      balanceEmoji.link = `${Config.webClientUrl}/uploads/balance-emojis/${balanceEmoji.emoji.nameOnServer}`;
    });

    Base.successResponse(response, Const.responsecodeSucceed, { balanceEmojiList });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "GetBalanceEmojiListController",
      error,
    });
  }
});

module.exports = router;
