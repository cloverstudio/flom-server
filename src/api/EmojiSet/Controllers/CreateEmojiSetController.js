"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { EmojiSet } = require("#models");

/**
 * @api {post} /api/v2/emoji-set/create Create emoji set
 * @apiVersion 0.0.1
 * @apiName  Create emoji set
 * @apiGroup WebAPI Emoji Set
 * @apiDescription  API which is called to create a new emoji set.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiParam {String} name  Emoji set name
 * @apiParam {Number} isDefault Is emoji set default (1-default, 0-not default)
 * @apiParam {File} image Image of emoji set (webp only)
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1677679287744,
 *     "data": {
 *         "emojiSet": {
 *             "itemsCount": 0,
 *             "image": {
 *                 "originalFileName": "giphy.webp",
 *                 "nameOnServer": "O4rX5O59M9pYD40WG9Vyu0vhMimUtwxZ.webp",
 *                 "mimeType": "image/webp",
 *                 "height": 176,
 *                 "width": 176,
 *                 "aspectRatio": 1
 *             },
 *             "created": 1677679287704,
 *             "modified": 1677679287704,
 *             "items": [],
 *             "isDeprecated": 0,
 *             "_id": "63ff5ab77126d258f556641f",
 *             "name": "novisetnakondeprecatedlogike",
 *             "isDefault": true,
 *             "aspectRatio": 1
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
 * @apiError (Errors) 443790 No emoji set name parameter
 * @apiError (Errors) 443606 Image file input error
 * @apiError (Errors) 443607 Only image files allowed
 * @apiError (Errors) 443609 Image file extension/type not allowed
 * @apiError (Errors) 443615 Input is not multipart form data
 * @apiError (Errors) 4000007 Token invalid
 */

router.post(
  "/",
  auth({
    allowAdmin: true,
    includedRoles: [Const.Role.ADMIN, Const.Role.STICKER_MANAGER, Const.Role.SUPER_ADMIN],
  }),
  async (request, response) => {
    try {
      if (request.headers["content-type"].indexOf("multipart") === -1) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInputNotMultipart,
          message: `CreateEmojiSetController - input is not multipart form data`,
        });
      }

      const { fields = {}, files = {} } = await Utils.formParse(request, {
        keepExtensions: true,
        type: "multipart",
        multiples: true,
        uploadDir: Config.uploadPath,
      });

      const { name, isDefault, countryCode } = fields;

      console.log("fields ", fields);

      if (name === undefined) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeNoEmojiSetNameParameter,
          message: `CreateEmojiSetController - no emoji set name parameter`,
        });
      }

      if (isDefault === undefined) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeNoIsDefaultParameter,
          message: `CreateEmojiSetController - no isDefault emoji set parameter`,
        });
      }

      const fileKeys = Object.keys(files);

      if (!fileKeys.includes("image") || fileKeys.length !== 1) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeImageFileInputError,
          message: `CreateEmojiSetController - problem with file input on emoji set creation`,
        });
      }

      const image = files.image;
      const fileMimeType = image.type;

      if (fileMimeType.indexOf("image") === -1) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeOnlyImageFilesAllowed,
          message: `CreateEmojiSetController - only image files allowed`,
        });
      }

      const { fileData, code } = await Utils.handleImageFile(image, "emojis", "webp");
      if (code === 123) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeExtensionNotAllowed,
          message: `CreateEmojiSetController - image extension not allowed`,
        });
      }

      const result = await EmojiSet.create({
        name,
        isDefault: Boolean(+isDefault),
        countryCode: countryCode || null,
        image: fileData,
      });

      const resultObject = result.toObject();
      resultObject.aspectRatio = result.image.aspectRatio;
      delete resultObject.__v;

      Base.successResponse(response, Const.responsecodeSucceed, {
        emojiSet: resultObject,
      });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "CreateEmojiSetController",
        error,
      });
    }
  },
);

module.exports = router;
