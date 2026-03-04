"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { BlessPacket } = require("#models");
const { addFlomojiLinks } = require("../helpers");

/**
 * @api {post} /api/v2/flomoji Create flomoji flom_v1
 * @apiVersion 2.0.10
 * @apiName  Create flomoji flom_v1
 * @apiGroup WebAPI Flomoji
 * @apiDescription  API which is called to create a new flomoji.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiParam {string} title          Title/name of flomoji
 * @apiParam {string} amount         Value of flomoji
 * @apiParam {string} creditsAmount  Value of flomoji in flom credits
 * @apiParam {string} position       Position of flomoji
 * @apiParam {string} keywords       Keywords of emoji (in a single string, separated by a comma)
 * @apiParam {File}   emoji          Image of emoji
 * @apiParam {File}   smallEmoji     Small image of emoji
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1660731589933,
 *     "data": {
 *         "flomoji": {
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
 *             "title": "abcd",
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
 * @apiError (Errors) 443603 No title
 * @apiError (Errors) 443604 No amount
 * @apiError (Errors) 443605 No position
 * @apiError (Errors) 443616 No keywords
 * @apiError (Errors) 443617 No creditsAmount
 * @apiError (Errors) 443606 Image file input error
 * @apiError (Errors) 443607 Only image files allowed
 * @apiError (Errors) 443609 Image file extension/type not allowed
 * @apiError (Errors) 443615 Input is not multipart form data
 * @apiError (Errors) 443613 Amount is not a number
 * @apiError (Errors) 443618 creditsAmount is not a number
 * @apiError (Errors) 4000007 Token invalid
 */

router.post("/", auth({ allowAdmin: true, role: Const.Role.ADMIN }), async (request, response) => {
  try {
    if (request.headers["content-type"].indexOf("multipart") === -1) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInputNotMultipart,
        message: `CreateFlomojiController, POST - input is not multipart form data`,
      });
    }

    const { fields = {}, files = {} } = await Utils.formParse(request, {
      keepExtensions: true,
      type: "multipart",
      multiples: true,
      uploadDir: Config.uploadPath,
    });
    const { title, keywords } = fields;
    const amount = +fields.amount ?? null;
    const creditsAmount = +fields.creditsAmount ?? null;
    const position = +fields.position ?? null;

    if (!title) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoFlomojiTitle,
        message: `CreateFlomojiController, POST - no flomoji title`,
      });
    }
    if (!keywords) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoFlomojiKeywords,
        message: `CreateFlomojiController, POST - no flomoji keywords`,
      });
    }
    if (!amount) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoFlomojiAmount,
        message: `CreateFlomojiController, POST - no flomoji amount`,
      });
    }
    if (!Number.isInteger(amount) || amount < 0 || isNaN(amount)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeAmountNotANumber,
        message: `CreateFlomojiController, POST - amount is not a positive integer`,
      });
    }
    if (!creditsAmount) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoFlomojiCreditsAmount,
        message: `CreateFlomojiController, POST - no flomoji credits amount`,
      });
    }
    if (!Number.isInteger(creditsAmount) || creditsAmount < 0 || isNaN(creditsAmount)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeCreditsAmountNotANumber,
        message: `CreateFlomojiController, POST - credits amount is not a positive integer`,
      });
    }
    if (!position) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoFlomojiPosition,
        message: `CreateFlomojiController, POST - no flomoji position`,
      });
    }
    if (!Number.isInteger(position) || position < 0 || isNaN(position)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodePositionNotANumber,
        message: `CreateFlomojiController, POST - position is not a positive integer`,
      });
    }

    const filesObject = {};
    const fileKeys = Object.keys(files);

    if (!fileKeys.includes("emoji") || !fileKeys.includes("smallEmoji") || fileKeys.length !== 2) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeImageFileInputError,
        message: `CreateFlomojiController, POST - something went wrong with flomoji image files input`,
      });
    }

    for (let i = 0; i < fileKeys.length; i++) {
      const file = files[fileKeys[i]];
      const fileMimeType = file.type;

      if (fileMimeType.indexOf("image") === -1) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeOnlyImageFilesAllowed,
          message: `CreateFlomojiController, POST - only image files allowed`,
        });
      }

      const { fileData, code } = await Utils.handleImageFile(file, "flomojis");
      if (code === 123) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeExtensionNotAllowed,
          message: `CreateFlomojiController, POST - image extension not allowed`,
        });
      }
      filesObject[fileKeys[i]] = fileData;
    }

    const { emoji, smallEmoji } = filesObject;

    const isPositionFilled = await BlessPacket.findOne({ position }).lean();
    if (isPositionFilled) {
      await BlessPacket.updateMany({ position: { $gt: position - 1 } }, { $inc: { position: 1 } });
    }

    const result = await BlessPacket.create({
      title,
      amount,
      creditsAmount,
      position,
      keywords,
      emoji,
      smallEmoji,
      emojiFileName: emoji.nameOnServer,
      smallEmojiFileName: smallEmoji.nameOnServer,
    });

    const resultWithLinks = addFlomojiLinks(result.toObject());

    Base.successResponse(response, Const.responsecodeSucceed, { flomoji: resultWithLinks });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "CreateFlomojiController, POST flomoji",
      error,
    });
  }
});

module.exports = router;
