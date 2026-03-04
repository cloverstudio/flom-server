"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, Config } = require("#config");
const { auth } = require("#middleware");
const { BalanceEmoji } = require("#models");
const fsp = require("fs/promises");
const path = require("path");

/**
 * @api {delete} /api/v2/balance-emoji/:id Delete balance emoji flom_v1
 * @apiVersion 2.0.10
 * @apiName  Delete balance emoji flom_v1
 * @apiGroup WebAPI Balance Emoji
 * @apiDescription  API which is called to delete a balance emoji
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1656404724285,
 *     "data": {
 *         "deletedBalanceEmoji": {
 *             "emoji": {
 *                 "originalFileName": "istockphoto-646511174-612x612.jpg",
 *                 "nameOnServer": "lRlxdliNN08o50GKeUNKy3asKi9xHh3b.jpg",
 *                 "mimeType": "image/jpeg",
 *                 "size": 24652,
 *                 "height": 612,
 *                 "width": 612
 *             },
 *             "limit": 100,
 *             "created": 1660731586634,
 *             "_id": "62fcc0c587a6c234704ff574"
 *         }
 *     }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443707 No emoji ID
 * @apiError (Errors) 443708 Emoji not found
 * @apiError (Errors) 443709 Problem while deleting emoji from database
 * @apiError (Errors) 4000007 Token invalid
 */

router.delete(
  "/:id",
  auth({ allowAdmin: true, role: Const.Role.ADMIN }),
  async (request, response) => {
    try {
      const emojiId = request.params.id;

      if (!emojiId) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeNoEmojiId,
          message: "DeleteBalanceEmojiController - no emoji ID",
        });
      }

      const balanceEmoji = await BalanceEmoji.findById(emojiId).lean();

      if (!balanceEmoji) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeEmojiNotFound,
          message: "DeleteBalanceEmojiController - no emoji found with given ID",
        });
      }

      const result = await BalanceEmoji.findByIdAndDelete(emojiId);

      if (!result) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeDeleteEmojiProblem,
          message: "DeleteBalanceEmojiController - there was a problem with deleting the emoji",
        });
      }

      const filePath = path.resolve(
        Config.uploadPath,
        `balance-emojis/${balanceEmoji.emoji.nameOnServer}`,
      );
      await fsp.unlink(filePath);

      Base.successResponse(response, Const.responsecodeSucceed, {
        deletedBalanceEmoji: result.toObject(),
      });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "DeleteBalanceEmojiController",
        error,
      });
    }
  },
);

module.exports = router;
