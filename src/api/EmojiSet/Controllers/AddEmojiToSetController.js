"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { EmojiSet } = require("#models");
const path = require("path");
const mongoose = require("mongoose");

/**
 * @api {post} }/api/v2/emoji-set/add-emoji Add emoji to emoji set
 * @apiVersion 0.0.1
 * @apiName  Add emoji to emoji set
 * @apiGroup WebAPI Emoji Set
 * @apiDescription  API which is called to add a new emoji in existing emoji set.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiParam {Boolean} animate Emoji animate(0-false, 1-true)
 * @apiParam {String} name Emoji name
 * @apiParam {String} emojiSetId Emoji set id in which emoji will be added
 * @apiParam {File} smallImage Small image of emoji (webp only)
 * @apiParam {File} bigImage Big image of emoji (webp only)
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1675619072888,
 *     "data": {}
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
 * @apiError (Errors) 4000007 Token invalid
 * @apiError (Errors) 443792 No emoji set id parameter
 * @apiError (Errors) 443791 Not valid emoji set id
 * @apiError (Errors) 443793 No emoji name parameter
 * @apiError (Errors) 443794 No animate parameter
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
          message: `AddEmojiToSetController, POST - input is not multipart form data`,
        });
      }

      const { fields = {}, files = {} } = await Utils.formParse(request, {
        keepExtensions: true,
        type: "multipart",
        multiples: true,
        uploadDir: Config.uploadPath,
      });
      const { name, animate, emojiSetId } = fields;

      if (emojiSetId === undefined) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeNoEmojiSetId,
          message: `AddEmojiToSetController - no emoji set id parameter`,
        });
      }

      const emojiSet = await EmojiSet.findOne({
        _id: emojiSetId,
      }).lean();

      if (!emojiSet) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeNotValidEmojiSetId,
          message: `AddEmojiToSetController - not valid emoji set id`,
        });
      }

      if (name === undefined) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeNoEmojiName,
          message: `AddEmojiToSetController - no emoji name parameter`,
        });
      }

      if (animate === undefined) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeNoAnimateParameter,
          message: `AddEmojiToSetController - no emoji animate parameter`,
        });
      }

      const filesObject = {};
      const fileKeys = Object.keys(files);

      //smallImage is    optional, if not provided then it should be created from bigImage but resized to 100x100
      if (!fileKeys.includes("bigImage")) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeImageFileInputError,
          message: `AddEmojiToSetController - something went wrong with emoji image files input`,
        });
      }

      for (let i = 0; i < fileKeys.length; i++) {
        const file = files[fileKeys[i]];
        const fileMimeType = file.type;

        if (fileMimeType.indexOf("image") === -1) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeOnlyImageFilesAllowed,
            message: `AddEmojiToSetController - only image files allowed`,
          });
        }

        const { fileData, code } = await Utils.handleImageFile(file, "emojis", "webp");

        if (code === 123) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeExtensionNotAllowed,
            message: `AddEmojiToSetController - image extension not allowed`,
          });
        }
        filesObject[fileKeys[i]] = fileData;
      }

      if (!filesObject.smallImage) {
        const bigImagePath = path.resolve(
          Config.uploadPath,
          `emojis/${filesObject.bigImage.nameOnServer}`,
        );
        const smallImageFileName = Utils.getRandomString(32) + ".webp";

        const smallImagePath = path.resolve(Config.uploadPath, `emojis/${smallImageFileName}`);

        const resizedImage = await Utils.resizeImage(bigImagePath, smallImagePath, 100, 100);

        filesObject.smallImage = {
          originalFileName: files.bigImage.name,
          nameOnServer: smallImageFileName,
          mimeType: "image/webp",
          size: resizedImage.size,
          height: resizedImage.height,
          width: resizedImage.width,
          aspectRatio: resizedImage.height / resizedImage.width,
        };
      }

      const { smallImage, bigImage } = filesObject;

      const emoji = {
        _id: new mongoose.Types.ObjectId(),
        name,
        bigImage,
        smallImage,
        animate: Boolean(Number(animate)),
      };

      await EmojiSet.updateOne(
        { _id: emojiSetId },
        { $push: { items: emoji }, $inc: { itemsCount: 1 } },
      );

      return Base.successResponse(response, Const.responsecodeSucceed);
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "AddEmojiToSetController",
        error,
      });
    }
  },
);

module.exports = router;
