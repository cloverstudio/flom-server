"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { EmojiSet } = require("#models");

/**
 * @api {get} /api/v2/emoji-set/all-sets Get list of emoji sets
 * @apiVersion 0.0.1
 * @apiName  Get list of emoji sets
 * @apiGroup WebAPI Emoji Set
 * @apiDescription  API which is called to get a list of emoji sets.
 *
 * @apiHeader {String} access-token Users unique access token.
 * @apiParam (Query string) {Number} [numberOfItems] Number of emojis to return. If this parameter is not provided, empty array of emojis in set will be returned
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1677681999323,
 *     "data": {
 *         "listOfEmojiSets": [
 *             {
 *                 "_id": "63f8d7b6017f5378dcc2fbda",
 *                 "itemsCount": 5,
 *                 "image": {
 *                     "originalFileName": "video_image-zO5fp5uA6.webp",
 *                     "nameOnServer": "peIyWXfbEEy6Y4OvcWpLN0dwnksfVn3a.webp",
 *                     "mimeType": "image/webp",
 *                     "height": 95,
 *                     "width": 95,
 *                     "aspectRatio": 1
 *                 },
 *                 "created": 1677252534127,
 *                 "modified": 1677515676968,
 *                 "name": "Animated new emoji",
 *                 "isDefault": false,
 *                 "isDeprecated": false,
 *                 "countryCode": "NG"
 *                 "items": [
 *                     {
 *                         "bigImage": {
 *                             "originalFileName": "emoji_7_big.webp",
 *                             "nameOnServer": "oDpDc2KoWJMoLJU3dobtkO2EmolTqYHL.webp",
 *                             "mimeType": "image/webp",
 *                             "height": 450,
 *                             "width": 500,
 *                             "aspectRatio": 0.9
 *                         },
 *                         "smallImage": {
 *                             "originalFileName": "emoji_7_small.webp",
 *                             "nameOnServer": "NpvBFp6NGnVw82dXOJT7mhR8YGgfKnbW.webp",
 *                             "mimeType": "image/webp",
 *                             "height": 90,
 *                             "width": 100,
 *                             "aspectRatio": 0.9
 *                         },
 *                         "created": 1677252749796,
 *                         "modified": 1677252749796,
 *                         "_id": "63f8d88d017f5378dcc2fbdb",
 *                         "name": "habla",
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

router.get(
  "/",
  auth({
    allowUser: true,
    allowAdmin: true,
    includedRoles: [Const.Role.ADMIN, Const.Role.STICKER_MANAGER, Const.Role.SUPER_ADMIN],
  }),
  async (request, response) => {
    try {
      const numberOfItems = +request.query.numberOfItems || 0;
      const userCountryCode = request.user.countryCode;
      const token = request.headers["access-token"];

      const isAdminPageRequest = token?.length === Const.adminPageTokenLength ? true : false;

      let matchStage = {
        isDeprecated: false,
      };

      if (!isAdminPageRequest) {
        matchStage.$or = [{ countryCode: userCountryCode }, { countryCode: null }];
      }

      let listOfEmojiSets;
      if (numberOfItems && numberOfItems > 0) {
        listOfEmojiSets = await EmojiSet.aggregate([
          {
            $match: matchStage,
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
                $slice: [
                  {
                    $filter: {
                      input: "$items",
                      as: "item",
                      cond: {
                        $ne: ["$$item.isDeprecated", true],
                      },
                    },
                  },
                  0,
                  numberOfItems,
                ],
              },
            },
          },
        ]);
      } else {
        listOfEmojiSets = await EmojiSet.aggregate([
          {
            $match: matchStage,
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
            },
          },
        ]);
      }

      Base.successResponse(response, Const.responsecodeSucceed, { listOfEmojiSets });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "GetEmojiSetsController",
        error,
      });
    }
  },
);

module.exports = router;
