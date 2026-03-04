"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { EmojiSet } = require("#models");
const mongoose = require("mongoose");

/**
 * @api {get} /api/v2/emoji-set/emojis/:id Get list of emojis in set
 * @apiVersion 0.0.1
 * @apiName  Get list of emojis from emoji set
 * @apiGroup WebAPI Emoji Set
 * @apiDescription  API which is called to get a list of emojis in set. If timestamp is privided, api returns only items whose modified parameter is greater than timestamp.
 *
 * @apiHeader {String} access-token Users unique access token.
 * @apiParam (Query string) {String} [page] Page number for paging (default 1)
 * @apiParam (Query string) {String} [itemsPerPage] Number of items per page (default 20)
 * @apiParam (Query string) {Number} [timestamp] Date in miliseconds.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1675684006081,
 *     "data": {
 *         "listOfEmojis": [
 *             {
 *                 "bigImage": {
 *                     "originalFileName": "giphy.webp",
 *                     "nameOnServer": "ivvD9wwbUZWT7kpWaRDFYe8p3hHxfG1y.webp",
 *                     "mimeType": "image/webp",
 *                     "height": 176,
 *                     "width": 176,
 *                     "aspectRatio": 1,
 *                     "link": "https://dev-old.flom.app/uploads/emojis/ivvD9wwbUZWT7kpWaRDFYe8p3hHxfG1y.webp"
 *                 },
 *                 "smallImage": {
 *                     "originalFileName": "giphy.webp",
 *                     "nameOnServer": "sj0jJJfWTqFjEb6waR1VZhW4JRoHujFC.webp",
 *                     "mimeType": "image/webp",
 *                     "height": 176,
 *                     "width": 176,
 *                     "aspectRatio": 1,
 *                     "link": "https://dev-old.flom.app/uploads/emojis/sj0jJJfWTqFjEb6waR1VZhW4JRoHujFC.webp"
 *                 },
 *                 "created": 1675681956815,
 *                 "modified": 1675681956815,
 *                 "_id": "63e0e0a410807d4790240e4e",
 *                 "name": "hahah",
 *                 "animate": false,
 *                 "isDeprecated": 1
 *             },
 *             .
 * 						 .
 * 						 .
 *         ],
 *         "total": 24,
 *         "countResult": 4,
 *         "hasNext": false
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
 * @apiError (Errors) 443792 No emoji set id parameter
 * @apiError (Errors) 443791 Not valid emoji set id
 */

router.get(
  "/:id",
  auth({
    allowUser: true,
    allowAdmin: true,
    includedRoles: [Const.Role.ADMIN, Const.Role.STICKER_MANAGER, Const.Role.SUPER_ADMIN],
  }),
  async (request, response) => {
    try {
      const emojiSetId = request.params.id;
      const page = +request.query.page || 1;
      const itemsPerPage = +request.query.itemsPerPage || Const.newPagingRows;
      const timestamp = +request.query.timestamp || 0;

      if (!emojiSetId) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeNoEmojiSetId,
          message: "EditEmojiSetController - no emoji set id",
        });
      }
      var emojiSet;
      if (itemsPerPage) {
        emojiSet = await EmojiSet.aggregate([
          {
            $match: {
              _id: new mongoose.Types.ObjectId(emojiSetId),
              isDeprecated: false,
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
              items: {
                $slice: [
                  {
                    $filter: {
                      input: "$items",
                      as: "item",
                      cond: {
                        $and: [
                          { $ne: ["$$item.isDeprecated", true] },
                          { $gt: ["$$item.modified", timestamp] },
                        ],
                      },
                    },
                  },
                  (page - 1) * itemsPerPage,
                  itemsPerPage,
                ],
              },
            },
          },
        ]);
      } else {
        emojiSet = await EmojiSet.aggregate([
          {
            $match: {
              _id: new mongoose.Types.ObjectId(emojiSetId),
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
              items: {
                $slice: [
                  {
                    $filter: {
                      input: "$items",
                      as: "item",
                      cond: {
                        $and: [
                          { $ne: ["$$item.isDeprecated", true] },
                          { $gt: ["$$item.modified", timestamp] },
                        ],
                      },
                    },
                  },
                  (page - 1) * Const.newPagingRows,
                  2 * Const.newPagingRows,
                ],
              },
            },
          },
        ]);
      }

      if (!emojiSet.length) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeNotValidEmojiSetId,
          message: "EditEmojiSetController - not valid emoji set id",
        });
      }

      const total = await EmojiSet.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(emojiSetId),
          },
        },
        {
          $project: {
            itemsCount: {
              $size: {
                $filter: {
                  input: "$items",
                  as: "item",
                  cond: {
                    $and: [
                      { $ne: ["$$item.isDeprecated", true] },
                      { $gt: ["$$item.modified", timestamp] },
                    ],
                  },
                },
              },
            },
          },
        },
      ]);

      const hasNext =
        page * itemsPerPage
          ? page * itemsPerPage < total[0].itemsCount
          : 2 * Const.newPagingRows < total[0].itemsCount;

      Base.successResponse(response, Const.responsecodeSucceed, {
        listOfEmojis: emojiSet[0].items,
        total: total[0].itemsCount,
        countResult: emojiSet[0].items.length,
        hasNext,
      });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "GetEmojisController",
        error,
      });
    }
  },
);

module.exports = router;
