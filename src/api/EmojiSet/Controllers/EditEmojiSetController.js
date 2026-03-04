"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { EmojiSet } = require("#models");
const path = require("path");
const fsp = require("fs/promises");

/**
 * @api {patch} /api/v2/emoji-set/edit-set/:id Edit emoji set
 * @apiVersion 0.0.1
 * @apiName  Edit emoji set
 * @apiGroup WebAPI Emoji Set
 * @apiDescription  API which is called to edit a emoji set. In the response, array of items will not be listed because of possible big number of items.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiParam {String} [name]  Emoji set name
 * @apiParam {Number} [isDefault] Is emoji set default (1-default, 0-not default)
 * @apiParam {File} [image] Image of emoji set (webp only)
 * @apiParam {Number} [isDeprecated] Is emoji deprecated (1-deprecated, 0-not deprecated)
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1677680290253,
 *     "data": {
 *         "updatedEmojiSet": {
 *             "itemsCount": 15,
 *             "image": {
 *                 "originalFileName": "1.webp",
 *                 "nameOnServer": "IUtZ5gJx91VhaFofcVEAywlz1llwqvl4.webp",
 *                 "mimeType": "image/webp",
 *                 "height": 368,
 *                 "width": 550,
 *                 "aspectRatio": 0.6690909090909091
 *             },
 *             "created": 1675757494212,
 *             "modified": 1677680290202,
 *             "items": [
 *                 "list of items"
 *             ],
 *             "isDeprecated": true,
 *             "_id": "63e207b65aa9786be1680b84",
 *             "name": "novoime22",
 *             "isDefault": true
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
 * @apiError (Errors) 443606 Image file input error
 * @apiError (Errors) 443607 Only image files allowed
 * @apiError (Errors) 443609 Image file extension/type not allowed
 * @apiError (Errors) 443615 Input is not multipart form data
 * @apiError (Errors) 443707 No emoji ID
 * @apiError (Errors) 443791 Not valid emoji set id
 * @apiError (Errors) 443796 Can not revert to not deprecated
 * @apiError (Errors) 4000007 Token invalid
 */

router.patch(
  "/:id",
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
          message: `EditEmojiSetController - input is not multipart form data`,
        });
      }

      const emojiSetId = request.params.id;

      if (!emojiSetId) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeNoEmojiSetId,
          message: "EditEmojiSetController - no emoji set id",
        });
      }

      var emojiSet = await EmojiSet.findOne({ _id: emojiSetId }).lean();

      if (!emojiSet) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeNotValidEmojiSetId,
          message: "EditEmojiSetController - not valid emoji set id",
        });
      }

      const { fields = {}, files = {} } = await Utils.formParse(request, {
        keepExtensions: true,
        type: "multipart",
        multiples: true,
        uploadDir: Config.uploadPath,
      });

      const { name, isDefault, isDeprecated, countryCode } = fields;

      if (countryCode && emojiSet.countryCode !== countryCode) emojiSet.countryCode = countryCode;

      if (name && emojiSet.name !== name) emojiSet.name = name;

      if (isDefault && emojiSet.isDefault !== Boolean(Number(isDefault))) {
        emojiSet.isDefault = Boolean(Number(isDefault));
      }

      if (isDeprecated && emojiSet.isDeprecated !== Boolean(Number(isDeprecated))) {
        if (Boolean(Number(isDeprecated)) === false && emojiSet.isDeprecated === true) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeCantRevertToNotDeprecated,
            message: `EditEmojiSetController - can not revert to not deprecated`,
          });
        }
        emojiSet.isDeprecated = Boolean(Number(isDeprecated));
      }

      const fileKeys = Object.keys(files);

      if (fileKeys.length) {
        if (!fileKeys.includes("image") || fileKeys.length !== 1) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeImageFileInputError,
            message: `EditEmojiSetController - problem with file input on emoji set creation`,
          });
        }

        const image = files.image;
        const fileMimeType = image.type;

        if (fileMimeType.indexOf("image") === -1) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeOnlyImageFilesAllowed,
            message: `EditEmojiSetController - only image files allowed`,
          });
        }

        const { fileData, code } = await Utils.handleImageFile(image, "emojis", "webp");
        if (code === 123) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeExtensionNotAllowed,
            message: `EditEmojiSetController - image extension not allowed`,
          });
        }

        const oldFilePath = path.resolve(
          Config.uploadPath,
          `emojis/${emojiSet.image.nameOnServer}`,
        );
        await fsp.unlink(oldFilePath);

        emojiSet.image = fileData;
      }

      emojiSet.modified = Date.now();

      const result = await EmojiSet.findOneAndUpdate(
        { _id: emojiSetId },
        { $set: emojiSet },
        { new: true },
      );

      const resultObject = result.toObject();
      resultObject.items = ["list of items"];
      delete resultObject.__v;

      Base.successResponse(response, Const.responsecodeSucceed, {
        updatedEmojiSet: resultObject,
      });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "EditEmojiSetController",
        error,
      });
    }
  },
);

module.exports = router;
