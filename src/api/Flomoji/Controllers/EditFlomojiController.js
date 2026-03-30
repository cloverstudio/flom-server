"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { BlessPacket } = require("#models");
const { addFlomojiLinks } = require("../helpers");
const fsp = require("fs/promises");

/**
 * @api {patch} /api/v2/flomoji/:flomojiId Edit flomoji flom_v1
 * @apiVersion 2.0.10
 * @apiName  Edit flomoji flom_v1
 * @apiGroup WebAPI Flomoji
 * @apiDescription  API which is called to edit a flomoji.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiParam {string} [title]          Title/name of flomoji
 * @apiParam {string} [amount]         Value of flomoji
 * @apiParam {string} [creditsAmount]  Value of flomoji in flom credits
 * @apiParam {string} [position]       Position of flomoji
 * @apiParam {string} [keywords]       Keywords of emoji (in a single string, separated by a comma)
 * @apiParam {File}   [emoji]          Image of emoji
 * @apiParam {File}   [smallEmoji]     Small image of emoji
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1660732316886,
 *     "data": {
 *         "updatedFlomoji": {
 *             "emoji": {
 *                 "originalFileName": "logo_liquid-60.webp",
 *                 "nameOnServer": "RBhcSiCoQf5nDGKYttB55zKmUlw8KHb9.webp",
 *                 "mimeType": "image/webp",
 *                 "size": 15710,
 *                 "height": 284,
 *                 "width": 475
 *             },
 *             "smallEmoji": {
 *                 "originalFileName": "logo_liquid-60_small.webp",
 *                 "nameOnServer": "3ti3JONrkccAoltAtyVdDEQ6SEm5csvH.webp",
 *                 "mimeType": "image/webp",
 *                 "size": 2144,
 *                 "height": 71,
 *                 "width": 118
 *             },
 *             "isDeleted": false,
 *             "created": 1660731586634,
 *             "_id": "62fcc0c587a6c234704ff574",
 *             "title": "abcdefghij",
 *             "amount": 2,
 *             "position": 67,
 *             "keywords": "logo,liquid",
 *             "emojiFileName": "RBhcSiCoQf5nDGKYttB55zKmUlw8KHb9.webp",
 *             "smallEmojiFileName": "3ti3JONrkccAoltAtyVdDEQ6SEm5csvH.webp",
 *             "__v": 0,
 *             "link": "https://dev-old.flom.app/api/v2/bless/emojis/RBhcSiCoQf5nDGKYttB55zKmUlw8KHb9.webp",
 *             "smallEmojiLink": "https://dev-old.flom.app/api/v2/bless/emojis/3ti3JONrkccAoltAtyVdDEQ6SEm5csvH.webp"
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
 * @apiError (Errors) 443601 No flomoji ID
 * @apiError (Errors) 443602 Flomoji not found
 * @apiError (Errors) 443606 Image file input error
 * @apiError (Errors) 443607 Only image files allowed
 * @apiError (Errors) 443609 Image file extension/type not allowed
 * @apiError (Errors) 443615 Input is not multipart form data
 * @apiError (Errors) 443613 Amount is not a number
 * @apiError (Errors) 443618 creditsAmount is not a number
 * @apiError (Errors) 4000007 Token invalid
 */

router.patch(
  "/:flomojiId",
  auth({ allowAdmin: true, role: Const.Role.ADMIN }),
  async (request, response) => {
    try {
      if (request.headers["content-type"].indexOf("multipart") === -1) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInputNotMultipart,
          message: `EditFlomojiController, PATCH - input is not multipart form data`,
        });
      }

      const flomojiId = request.params.flomojiId;

      if (!flomojiId) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeNoFlomojiId,
          message: `EditFlomojiController, PATCH - no flomoji ID`,
        });
      }

      const { fields = {}, files = {} } = await Utils.formParse(request, {
        keepExtensions: true,
        type: "multipart",
      });
      const { title, keywords } = fields || {};
      const amount = +(fields.amount || 0);
      const creditsAmount = +(fields.creditsAmount || 0);
      const position = +(fields.position || 0);

      if (amount && (!Number.isInteger(amount) || amount < 0 || isNaN(amount))) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeAmountNotANumber,
          message: `EditFlomojiController, PATCH - amount is not a positive integer`,
        });
      }
      if (
        creditsAmount &&
        (!Number.isInteger(creditsAmount) || creditsAmount < 0 || isNaN(creditsAmount))
      ) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeCreditsAmountNotANumber,
          message: `EditFlomojiController, PATCH - credits amount is not a positive integer`,
        });
      }
      if (position && (!Number.isInteger(position) || position < 0 || isNaN(position))) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodePositionNotANumber,
          message: `EditFlomojiController, PATCH - position is not a positive integer`,
        });
      }

      const updateData = {};

      const flomoji = await BlessPacket.findOne({ _id: flomojiId }).lean();
      if (!flomoji) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeFlomojiNotFound,
          message: "EditFlomojiController, PATCH - no flomoji found with given ID",
        });
      }

      if (title) updateData.title = title;
      if (amount) updateData.amount = amount;
      if (creditsAmount) updateData.creditsAmount = creditsAmount;
      if (position) updateData.position = position;
      if (keywords) updateData.keywords = keywords;

      const filesObject = {};
      const fileKeys = Object.keys(files);

      if (fileKeys.length !== 0) {
        for (let i = 0; i < fileKeys.length; i++) {
          const file = files[fileKeys[i]];

          const fileMimeType = file.type;

          if (fileMimeType.indexOf("image") === -1) {
            return Base.newErrorResponse({
              response,
              code: Const.responsecodeOnlyImageFilesAllowed,
              message: `EditFlomojiController, PATCH - only image files allowed`,
            });
          }

          const { fileData, code } = await Utils.handleImageFile(file, "flomojis");
          if (code === 123) {
            return Base.newErrorResponse({
              response,
              code: Const.responsecodeExtensionNotAllowed,
              message: `EditFlomojiController, PATCH - image extension not allowed`,
            });
          }
          filesObject[fileKeys[i]] = fileData;
        }
      }

      const { emoji, smallEmoji } = filesObject;

      if (emoji) {
        updateData.emoji = emoji;
        updateData.emojiFileName = emoji.nameOnServer;
        await fsp.copyFile(
          `${Config.uploadPath}/flomojis/${flomoji.emoji.nameOnServer}`,
          `${Config.uploadPath}/flomojis/deleted/${flomoji.emoji.nameOnServer}`,
        );
        await fsp.unlink(`${Config.uploadPath}/flomojis/${flomoji.emoji.nameOnServer}`);
      }
      if (smallEmoji) {
        updateData.smallEmoji = smallEmoji;
        updateData.smallEmojiFileName = smallEmoji.nameOnServer;
        try {
          await fsp.copyFile(
            `${Config.uploadPath}/flomojis/${flomoji.smallEmoji.nameOnServer}`,
            `${Config.uploadPath}/flomojis/deleted/${flomoji.smallEmoji.nameOnServer}`,
          );

          await fsp.unlink(`${Config.uploadPath}/flomojis/${flomoji.smallEmoji.nameOnServer}`);
        } catch (error) {
          logger.error("EditFlomojiController - delete small emoji", error);
        }
      }

      if (position) {
        const isPositionFilled = await BlessPacket.findOne({ position }, { _id: 1 }).lean();
        if (isPositionFilled) {
          if (position < flomoji.position) {
            const res = await BlessPacket.updateMany(
              { position: { $gt: position - 1, $lt: flomoji.position } },
              { $inc: { position: 1 } },
            );
          } else if (flomoji.position < position) {
            const res = await BlessPacket.updateMany(
              { position: { $gt: flomoji.position, $lt: position + 1 } },
              { $inc: { position: -1 } },
            );
          }
        }
      }

      const result = await BlessPacket.findByIdAndUpdate(flomojiId, updateData, {
        new: true,
      });

      const resultWithLinks = addFlomojiLinks(result.toObject());

      Base.successResponse(response, Const.responsecodeSucceed, {
        updatedFlomoji: resultWithLinks,
      });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "EditFlomojiController, PATCH flomoji",
        error,
      });
    }
  },
);

module.exports = router;
