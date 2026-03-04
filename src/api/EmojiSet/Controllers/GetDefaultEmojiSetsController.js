"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { EmojiSet } = require("#models");
/**
 * @api {get} /api/v2/emoji-set/default-sets Get list of default emoji sets
 * @apiVersion 0.0.1
 * @apiName  Get list of default emoji sets
 * @apiGroup WebAPI Emoji Set
 * @apiDescription  API which is called to get a list of default emoji sets. API returns only default sets whose modified date is after date passed as parameter.
 *
 * @apiHeader {String} access-token Users unique access token.
 * @apiParam (Query string) {Number} [timestamp] Date in miliseconds.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1677680799998,
 *     "data": {
 *         "listOfEmojiSets": [
 *             {
 *                 "_id": "63ef3ffedf7b1e66ed9c0347",
 *                 "itemsCount": 4,
 *                 "image": {
 *                     "originalFileName": "laughing_emoji_Png_Picture.webp",
 *                     "nameOnServer": "KEcdlRvBH3k0wmpD9uddIyf8JqxLQZl5.webp",
 *                     "mimeType": "image/webp",
 *                     "height": 100,
 *                     "width": 99,
 *                     "aspectRatio": 1.0101010101010102
 *                 },
 *                 "created": 1676623870539,
 *                 "modified": 1677515681819,
 *                 "name": "IvoTestSet",
 *                 "isDefault": true,
 *                 "isDeprecated": false,
 *                 "countryCode": "NG"
 *                 "items": [
 *                     {
 *                         "bigImage": {
 *                             "originalFileName": "emoji_1_big.webp",
 *                             "nameOnServer": "op9GS0rxkC8WXt5hxJjo1B3tzJ3V36rO.webp",
 *                             "mimeType": "image/webp",
 *                             "height": 500,
 *                             "width": 500,
 *                             "aspectRatio": 1
 *                         },
 *                         "smallImage": {
 *                             "originalFileName": "emoji_1_small.webp",
 *                             "nameOnServer": "qvLHfTMOaDIm5L9vvleSBSauucQ5tBle.webp",
 *                             "mimeType": "image/webp",
 *                             "height": 100,
 *                             "width": 100,
 *                             "aspectRatio": 1
 *                         },
 *                         "created": 1676901990333,
 *                         "modified": 1676901990333,
 *                         "_id": "63f37e664bda8e55b8b3c5a5",
 *                         "name": "Boundry_warnin_try me_Angry_vex_crase_mad_para_waat",
 *                         "animate": true,
 *                         "isDeprecated": false
 *                     },
 *                     .
 *                     .
 *                     .
 *                 ]
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

router.get("/", auth({ allowUser: true }), async (request, response) => {
  try {
    const timestamp = +request.query.timestamp || 0;

    const userCountryCode = request.user.countryCode;

    const listOfEmojiSets = await EmojiSet.aggregate([
      {
        $match: {
          isDefault: true,
          modified: { $gte: timestamp },
          isDeprecated: false,
          $or: [{ countryCode: userCountryCode }, { countryCode: null }],
        },
      },
      {
        $project: {
          _id: 1,
          itemsCount: 1,
          image: 1,
          created: 1,
          modified: 1,
          name: 1,
          isDefault: 1,
          isDeprecated: 1,
          countryCode: 1,
          items: {
            $filter: {
              input: "$items",
              as: "item",
              cond: {
                $ne: ["$$item.isDeprecated", true],
              },
            },
          },
        },
      },
    ]);

    Base.successResponse(response, Const.responsecodeSucceed, { listOfEmojiSets });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "GetDefaultEmojiSetsController",
      error,
    });
  }
});

module.exports = router;
