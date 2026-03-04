"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { EmojiSet } = require("#models");
const mongoose = require("mongoose");

/**
 * @api {delete} /api/v2/emoji-set/delete/:setId/:emojiId? Delete emoji or emoji set
 * @apiVersion 0.0.1
 * @apiName  Delete emoji or emoji set
 * @apiGroup WebAPI Emoji Set
 * @apiDescription  API which is called to delete emoji or emoji set. Emoji setId parameter must be passed while emojiId is passed only if occurring emoji deletion.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1675623393366,
 *     "data": {}
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
 * @apiError (Errors) 443792 No emoji set id
 * @apiError (Errors) 443791 Not valid emoji set id
 * @apiError (Errors) 443709 Problem while deleting emoji from database
 * @apiError (Errors) 4000007 Token invalid
 */

router.delete(
  "/:setId/:emojiId?",
  auth({
    allowAdmin: true,
    role: Const.Role.ADMIN,
  }),
  async (request, response) => {
    try {
      const emojiSetId = request.params.setId;
      const emojiId = request.params.emojiId;

      if (!emojiSetId) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeNoEmojiSetId,
          message: "DeleteEmojiOrSetController - no emoji set id",
        });
      }

      const emojiSet = await EmojiSet.findOne({ _id: emojiSetId }).lean();

      if (!emojiSet) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeNotValidEmojiSetId,
          message: "DeleteEmojiOrSetController - not valid emoji set id",
        });
      }

      if (emojiId) {
        var emojiInSet = await EmojiSet.findOne(
          {
            "items._id": new mongoose.Types.ObjectId(emojiId),
          },
          { "items.$": 1, _id: 0 },
        ).lean();

        if (!emojiInSet.items[0]) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeEmojiNotFound,
            message: "DeleteEmojiOrSetController - not valid emoji id",
          });
        }
      }

      var result;

      if (emojiId) {
        result = await EmojiSet.updateOne(
          { _id: emojiSetId, "items._id": new mongoose.Types.ObjectId(emojiId) },
          { $set: { isDeprecated: true, $inc: { itemsCount: -1 } } },
        );
      } else {
        result = await EmojiSet.updateOne({ _id: emojiSetId }, { $set: { isDeprecated: true } });
      }

      if (!result.ok) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeDeleteEmojiProblem,
          message:
            "DeleteEmojiOrSetController - there was a problem with deleting the emoji or emoji set",
        });
      }

      //this api is actually just setting the emoji or emoji set to deprecated so all images needs to stay on server in order to be reachable to users who downloaded stickers before they are deprecated
      /*if (emojiId) {
          const filePathSmallImage = path.resolve(
            Config.uploadPath,
            `emojis/${emojiInSet.items[0].smallImage.nameOnServer}`
          );
          const filePathBigImage = path.resolve(
            Config.uploadPath,
            `emojis/${emojiInSet.items[0].bigImage.nameOnServer}`
          );
          await fs.unlink(filePathSmallImage);
          await fs.unlink(filePathBigImage);
        } else {
          const filePath = path.resolve(Config.uploadPath, `emojis/${emojiSet.image.nameOnServer}`);
          await fs.unlink(filePath);
        }*/

      Base.successResponse(response, Const.responsecodeSucceed);
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "DeleteEmojiOrSetController",
        error,
      });
    }
  },
);

module.exports = router;
