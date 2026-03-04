"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { BalanceEmoji } = require("#models");
const fsp = require("fs/promises");
const path = require("path");

/**
 * @api {patch} /api/v2/balance-emoji/:id Edit balance emoji flom_v1
 * @apiVersion 2.0.10
 * @apiName  Edit balance emoji flom_v1
 * @apiGroup WebAPI Balance Emoji
 * @apiDescription  API which is called to edit a balance emoji.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiParam {String} [limit]  Credit balance limit for balance emoji (inclusive - 1000 means from 1000 including 1000)
 * @apiParam {File}   [emoji]  Image of balance emoji
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1660732316886,
 *     "data": {
 *         "updatedBalanceEmoji": {
 *             "emoji": {
 *                 "originalFileName": "logo_liquid-60.webp",
 *                 "nameOnServer": "RBhcSiCoQf5nDGKYttB55zKmUlw8KHb9.webp",
 *                 "mimeType": "image/webp",
 *                 "size": 15710,
 *                 "height": 284,
 *                 "width": 475
 *             },
 *             "limit": 200,
 *             "created": 1660731586634,
 *             "_id": "62fcc0c587a6c234704ff574",
 *             "link": "https://dev-old.flom.app/uploads/balance-emojis/RBhcSiCoQf5nDGKYttB55zKmUlw8KHb9.webp"
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
 * @apiError (Errors) 443706 limit parameter is not a positive integer
 * @apiError (Errors) 443707 No emoji ID
 * @apiError (Errors) 443708 Emoji not found
 * @apiError (Errors) 443606 Image file input error
 * @apiError (Errors) 443607 Only image files allowed
 * @apiError (Errors) 443609 Image file extension/type not allowed
 * @apiError (Errors) 443615 Input is not multipart form data
 * @apiError (Errors) 4000007 Token invalid
 */

router.patch(
  "/:id",
  auth({ allowAdmin: true, role: Const.Role.ADMIN }),
  async (request, response) => {
    try {
      if (request.headers["content-type"].indexOf("multipart") === -1) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInputNotMultipart,
          message: `EditBalanceEmojiController - input is not multipart form data`,
        });
      }

      const emojiId = request.params.id;

      if (!emojiId) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeNoEmojiId,
          message: `EditBalanceEmojiController - no emoji ID`,
        });
      }

      const { fields = {}, files = {} } = await Utils.formParse(request, {
        keepExtensions: true,
        type: "multipart",
        multiples: true,
        uploadDir: Config.uploadPath,
      });
      const limit = +fields.limit;

      if (limit !== undefined && (!Number.isInteger(limit) || limit < 0 || isNaN(limit))) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeAmountNotANumber,
          message: `EditBalanceEmojiController - limit is not a positive integer`,
        });
      }

      const updateData = {};

      const balanceEmoji = await BalanceEmoji.findById(emojiId).lean();
      if (!balanceEmoji) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeEmojiNotFound,
          message: "EditBalanceEmojiController - no emoji found with given ID",
        });
      }

      if (limit !== undefined) updateData.limit = limit;

      let fileData = null;
      const fileKeys = Object.keys(files);

      if (fileKeys.length !== 0) {
        const file = files.emoji;

        const fileMimeType = file.type;

        if (fileMimeType.indexOf("image") === -1) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeOnlyImageFilesAllowed,
            message: `EditBalanceEmojiController - only image files allowed`,
          });
        }

        const { fileData: data, code } = await Utils.handleImageFile(file, "balance-emojis");
        if (code === 123) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeExtensionNotAllowed,
            message: `EditBalanceEmojiController - image extension not allowed`,
          });
        }
        fileData = data;
      }

      if (fileData) {
        updateData.emoji = fileData;
        const filePath = path.resolve(
          Config.uploadPath,
          `balance-emojis/${balanceEmoji.emoji.nameOnServer}`,
        );
        await fsp.unlink(filePath);
      }

      if (_.isEmpty(updateData)) {
        return Base.successResponse(response, Const.responsecodeSucceed, {
          updatedBalanceEmoji: balanceEmoji,
        });
      }

      const result = await BalanceEmoji.findByIdAndUpdate(emojiId, updateData, {
        new: true,
      });

      const resultObject = result.toObject();
      resultObject.link = `${Config.webClientUrl}/uploads/balance-emojis/${resultObject.emoji.nameOnServer}`;

      Base.successResponse(response, Const.responsecodeSucceed, {
        updatedBalanceEmoji: resultObject,
      });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "EditBalanceEmojiController",
        error,
      });
    }
  },
);

module.exports = router;
