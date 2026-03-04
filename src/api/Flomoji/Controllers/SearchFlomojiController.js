"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { BlessPacket } = require("#models");
const { addFlomojiLinks } = require("../helpers");

/**
 * @api {get} /api/v2/flomoji/search Search flomoji flom_v1
 * @apiVersion 2.0.10
 * @apiName  Search flomoji flom_v1
 * @apiGroup WebAPI Flomoji
 * @apiDescription  API which is called to search for a flomoji by its name/title.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiParam (Query string) {string} searchParam  Full or partial title/name of flomoji
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1660732680913,
 *     "data": {
 *         "flomojis": [
 *             {
 *                 "_id": "61bc3cad2146cf2ba2e57755",
 *                 "title": "Fax",
 *                 "amount": 15,
 *                 "emojiFileName": "bless04",
 *                 "name": "",
 *                 "position": 4,
 *                 "keywords": "logo,liquid",
 *                 "smallEmojiFileName": "",
 *                 "value": 0,
 *                 "link": "https://dev-old.flom.app/api/v2/bless/emojis/bless04.webp",
 *                 "smallEmojiLink": ""
 *             },
 *             {
 *                 "_id": "624c278794c5e2978090a3ed",
 *                 "title": "Fax",
 *                 "amount": 15,
 *                 "emojiFileName": "bless44",
 *                 "name": "",
 *                 "position": 36,
 *                 "keywords": "logo,liquid",
 *                 "smallEmojiFileName": "",
 *                 "value": 0,
 *                 "link": "https://dev-old.flom.app/api/v2/bless/emojis/bless44.webp",
 *                 "smallEmojiLink": ""
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

router.get("/search", async (request, response) => {
  try {
    const regex = new RegExp(request.query.searchParam, "i");
    const flomojis = await BlessPacket.find({
      $or: [{ title: regex }, { keywords: regex }],
      isDeleted: false,
    })
      .sort({ position: 1 })
      .lean();

    const { userRate, userCountryCode, userCurrency } = await Utils.getUsersConversionRate({
      user: request.user,
      accessToken: request.headers["access-token"],
    });

    const flomojisWithLinks = [];
    for (let i = 0; i < flomojis.length; i++) {
      if (userRate) {
        flomojis[i].userPrice = {
          countryCode: userCountryCode,
          currency: userCurrency,
          value: Utils.roundNumber(flomojis[i].amount * userRate, 2),
        };
      }

      flomojisWithLinks.push(addFlomojiLinks(flomojis[i]));
    }

    Base.successResponse(response, Const.responsecodeSucceed, { flomojis: flomojisWithLinks });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "SearchFlomojiController, GET",
      error,
    });
  }
});

module.exports = router;
