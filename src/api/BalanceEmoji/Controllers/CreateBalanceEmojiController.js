"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { BalanceEmoji } = require("#models");

/**
 * @api {post} /api/v2/balance-emoji Create balance emoji flom_v1
 * @apiVersion 2.0.10
 * @apiName  Create balance emoji flom_v1
 * @apiGroup WebAPI Balance Emoji
 * @apiDescription  API which is called to create a new balance emoji.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiParam {String} limit  Credit balance limit for balance emoji (inclusive - 1000 means from 1000 including 1000)
 * @apiParam {File}   emoji  Image of balance emoji
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1660731589933,
 *     "data": {
 *         "balanceEmoji": {
 *             "emoji": {
 *                 "originalFileName": "logo_liquid-60.webp",
 *                 "nameOnServer": "RBhcSiCoQf5nDGKYttB55zKmUlw8KHb9.webp",
 *                 "mimeType": "image/webp",
 *                 "size": 15710,
 *                 "height": 284,
 *                 "width": 475
 *             },
 *             "limit": 100,
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
 * @apiError (Errors) 443705 No limit parameter
 * @apiError (Errors) 443706 limit parameter is not a positive integer
 * @apiError (Errors) 443606 Image file input error
 * @apiError (Errors) 443607 Only image files allowed
 * @apiError (Errors) 443609 Image file extension/type not allowed
 * @apiError (Errors) 443615 Input is not multipart form data
 * @apiError (Errors) 4000007 Token invalid
 */

router.post("/", auth({ allowAdmin: true, role: Const.Role.ADMIN }), async (request, response) => {
  try {
    if (request.headers["content-type"].indexOf("multipart") === -1) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInputNotMultipart,
        message: `CreateBalanceEmojiController - input is not multipart form data`,
      });
    }

    const { fields = {}, files = {} } = await Utils.formParse(request, {
      keepExtensions: true,
      type: "multipart",
      multiples: true,
      uploadDir: Config.uploadPath,
    });
    const limit = +fields.limit;

    if (fields.limit === undefined) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoLowerLimit,
        message: `CreateBalanceEmojiController - no limit`,
      });
    }
    if (!Number.isInteger(limit) || limit < 0 || isNaN(limit)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeLowerLimitNotANumber,
        message: `CreateBalanceEmojiController - limit is not a positive integer`,
      });
    }

    const fileKeys = Object.keys(files);

    if (!fileKeys.includes("emoji") || fileKeys.length !== 1) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeImageFileInputError,
        message: `CreateBalanceEmojiController - something went wrong with emoji image file input`,
      });
    }

    const file = files.emoji;
    const fileMimeType = file.type;

    if (fileMimeType.indexOf("image") === -1) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeOnlyImageFilesAllowed,
        message: `CreateBalanceEmojiController - only image files allowed`,
      });
    }

    const { fileData, code } = await Utils.handleImageFile(file, "balance-emojis");
    if (code === 123) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeExtensionNotAllowed,
        message: `CreateBalanceEmojiController - image extension not allowed`,
      });
    }

    const result = await BalanceEmoji.create({
      limit,
      emoji: fileData,
    });

    const resultObject = result.toObject();
    resultObject.link = `${Config.webClientUrl}/uploads/balance-emojis/${resultObject.emoji.nameOnServer}`;

    Base.successResponse(response, Const.responsecodeSucceed, {
      balanceEmoji: resultObject,
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "CreateBalanceEmojiController",
      error,
    });
  }
});

module.exports = router;
