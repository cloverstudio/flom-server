"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { BlessPacket } = require("#models");
const fsp = require("fs/promises");
const { addFlomojiLinks } = require("../../Flomoji/helpers");
const path = require("path");

/**
 * @api {get} /api/v2/bless/packets Get super bless packets
 * @apiVersion 2.0.9
 * @apiName Get super bless packets
 * @apiGroup WebAPI Bless
 * @apiDescription Returns super bless packets. If multi parameter is 1 then API will return different response
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam (Query string) {String} multi Send 1 if you want API to return multiple bless packets (32 instead of 8). Default 0
 * @apiParam (Query string) {String} page Page number. Default 1
 *
 * @apiSuccessExample Success Response (multi 0)
 * {
 *   "code": 1,
 *   "time": 1634125456349,
 *   "data": {
 *     "packets": [
 *       {
 *         "_id": "61b7384e972ef3a7e9bb0cd3",
 *         "created": 1639397454413,
 *         "title": "Fit",
 *         "amount": 1,
 *         "emojiFileName": "bless01",
 *         "link": "https://dev-old.flom.app/api/v2/bless/emojis/bless01.webp"
 *       },
 *     ]
 *     "hasNext": false,
 *   }
 * }
 *
 * @apiSuccessExample Success Response (multi 1)
 * {
 *   "code": 1,
 *   "time": 1649158030417,
 *   "data": {
 *     "packets": [
 *       [
 *         {
 *           "_id": "61bc3cad2146cf2ba2e57752",
 *           "title": "Fit",
 *           "amount": 1,
 *           "emojiFileName": "bless01",
 *           "link": "https://dev-old.flom.app/api/v2/bless/emojis/bless01.webp"
 *         }
 *       ],
 *       [
 *         {
 *           "_id": "624c267b94c5e2978090a3d2",
 *           "title": "Fit",
 *           "amount": 1,
 *           "emojiFileName": "bless11",
 *           "link": "https://dev-old.flom.app/api/v2/bless/emojis/bless11.webp"
 *         }
 *       ],
 *       [
 *         {
 *           "_id": "624c270f94c5e2978090a3da",
 *           "title": "Fit",
 *           "amount": 1,
 *           "emojiFileName": "bless21",
 *           "link": "https://dev-old.flom.app/api/v2/bless/emojis/bless21.webp"
 *         }
 *       ],
 *       [
 *         {
 *           "_id": "624c273694c5e2978090a3e2",
 *           "title": "Fit",
 *           "amount": 1,
 *           "emojiFileName": "bless31",
 *           "link": "https://dev-old.flom.app/api/v2/bless/emojis/bless31.webp"
 *         }
 *       ]
 *     ],
 *     "hasNext": false,
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 4000007 Token not valid
 */

router.get("/packets", async function (request, response) {
  try {
    const { page = 1 } = request.query;
    const multi = !!+request.query.multi;
    const itemsPerPage = multi ? Const.pagingMultiBlessPackets : Const.pagingBlessPackets;

    const blessPackets = await BlessPacket.find({ isDeleted: false })
      .sort({ position: 1 })
      .skip((page - 1) * itemsPerPage)
      .limit(itemsPerPage)
      .lean();
    const total = await BlessPacket.countDocuments();

    if (blessPackets.length === 0) {
      return Base.successResponse(response, Const.responsecodeSucceed, {
        packets: [],
        hasNext: false,
      });
    }

    const { userRate, userCountryCode, userCurrency } = await Utils.getUsersConversionRate({
      user: request.user,
      accessToken: request.headers["access-token"],
    });
    for (let packet of blessPackets) {
      delete packet.__v;
      packet = addFlomojiLinks(packet);

      if (userRate) {
        packet.userPrice = {
          countryCode: userCountryCode,
          currency: userCurrency,
          value: Utils.roundNumber(packet.amount * userRate, 2),
        };
      }
    }

    let packets = [];
    if (!multi) {
      packets = blessPackets.slice(0, 8);
    } else {
      while (blessPackets.length > 0) {
        packets.push(blessPackets.splice(0, 8).sort((a, b) => a.position - b.position));
      }
    }
    Base.successResponse(response, Const.responsecodeSucceed, {
      packets,
      hasNext: page * itemsPerPage < total,
    });
  } catch (error) {
    return Base.errorResponse(
      response,
      Const.httpCodeServerError,
      "BlessController - get packets",
      error,
    );
  }
});

/**
 * @api {get} /api/v2/bless/emojis/:emojiName Get bless packet emoji
 * @apiVersion 2.0.9
 * @apiName Get bless packet emoji
 * @apiGroup WebAPI Bless
 * @apiDescription Returns bless packet emoji. EmojiName should contain extension (e.g. bless01.webp). Emoji is in .webp format
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 443391 Emoji file not found
 */

router.get("/emojis/:emojiName", async function (request, response) {
  try {
    if (!request.params.emojiName) {
      return Base.successResponse(response, Const.responsecodeFileNotFound);
    }

    const fileName = request.params.emojiName;
    const filePath = path.resolve(Config.uploadPath, "flomojis", fileName);
    const filePathDeleted = path.resolve(Config.uploadPath, "flomojis", "deleted", fileName);

    try {
      await fsp.access(filePath, fsp.constants.R_OK);
      return response.sendFile(filePath);
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
      console.log("ENOENT 1");
    }

    try {
      await fsp.access(filePathDeleted, fsp.constants.R_OK);
      return response.sendFile(filePathDeleted);
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
      console.log("ENOENT 2");
    }

    return Base.successResponse(response, Const.responsecodeFileNotFound, "BlessController", error);
  } catch (error) {
    return Base.errorResponse(response, Const.httpCodeServerError, "BlessController", error);
  }
});

module.exports = router;
