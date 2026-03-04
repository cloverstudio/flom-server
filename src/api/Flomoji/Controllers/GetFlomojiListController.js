"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { BlessPacket } = require("#models");
const { addFlomojiLinks } = require("../helpers");

/**
 * @api {get} /api/v2/flomoji Get flomoji list flom_v1
 * @apiVersion 2.0.10
 * @apiName  Get flomoji list flom_v1
 * @apiGroup WebAPI Flomoji
 * @apiDescription  API which is called to get a list of available flomojis
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1660732536009,
 *     "data": {
 *         "flomojiList": [
 *             {
 *                 "_id": "61bc3cad2146cf2ba2e57752",
 *                 "title": "Fit",
 *                 "amount": 1,
 *                 "emojiFileName": "bless01",
 *                 "name": "",
 *                 "position": 1,
 *                 "smallEmojiFileName": "",
 *                 "value": 0,
 *                 "link": "https://dev-old.flom.app/api/v2/bless/emojis/bless01.webp",
 *                 "smallEmojiLink": ""
 *             },
 *             {
 *                 "_id": "62fcc0c587a6c234704ff574",
 *                 "emoji": {
 *                     "originalFileName": "logo_liquid-60.webp",
 *                     "nameOnServer": "RBhcSiCoQf5nDGKYttB55zKmUlw8KHb9.webp",
 *                     "mimeType": "image/webp",
 *                     "size": 15710,
 *                     "height": 284,
 *                     "width": 475
 *                 },
 *                 "smallEmoji": {
 *                     "originalFileName": "logo_liquid-60_small.webp",
 *                     "nameOnServer": "3ti3JONrkccAoltAtyVdDEQ6SEm5csvH.webp",
 *                     "mimeType": "image/webp",
 *                     "size": 2144,
 *                     "height": 71,
 *                     "width": 118
 *                 },
 *                 "isDeleted": false,
 *                 "created": 1660731586634,
 *                 "title": "abcdefghij",
 *                 "amount": 2,
 *                 "position": 67,
 *                 "keywords": "logo,liquid",
 *                 "emojiFileName": "RBhcSiCoQf5nDGKYttB55zKmUlw8KHb9.webp",
 *                 "smallEmojiFileName": "3ti3JONrkccAoltAtyVdDEQ6SEm5csvH.webp",
 *                 "__v": 0,
 *                 "link": "https://dev-old.flom.app/api/v2/bless/emojis/RBhcSiCoQf5nDGKYttB55zKmUlw8KHb9.webp",
 *                 "smallEmojiLink": "https://dev-old.flom.app/api/v2/bless/emojis/3ti3JONrkccAoltAtyVdDEQ6SEm5csvH.webp"
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
    const flomojiList = await BlessPacket.find({ isDeleted: false }).sort({ position: 1 }).lean();

    if (!flomojiList || flomojiList.length === 0) {
      return Base.successResponse(response, Const.responsecodeSucceed, {
        flomojiList: [],
      });
    }

    const flomojiListWithLinks = [];

    for (let i = 0; i < flomojiList.length; i++)
      flomojiListWithLinks.push(addFlomojiLinks(flomojiList[i]));

    Base.successResponse(response, Const.responsecodeSucceed, {
      flomojiList: flomojiListWithLinks,
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "GetFlomojiListController, GET List",
      error,
    });
  }
});

module.exports = router;
