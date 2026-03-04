"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { EmojiSet } = require("#models");
const path = require("path");
const mongoose = require("mongoose");
const fsp = require("fs/promises");

/**
 * @api {patch} /api/v2/emoji-set/edit-emoji/:setId/:emojiId Edit emoji in set
 * @apiVersion 0.0.1
 * @apiName  Edit emoji in set
 * @apiGroup WebAPI Emoji Set
 * @apiDescription  API which is called to edit a emoji in set.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiParam {Number} [animate] Emoji animate (1-animate, 0-not animate)
 * @apiParam {String} [name] Emoji name
 * @apiParam {File} [smallImage] Small image of emoji (webp only)
 * @apiParam {File} [bigImage] Big image of emoji (webp only)
 * @apiParam {Number} [isDeprecated] Is emoji deprecated (1-deprecated, 0-not deprecated)
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1675630793140,
 *     "data": {}
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443615 Input is not multipart form data
 * @apiError (Errors) 443792 No emoji set id
 * @apiError (Errors) 443707 No emoji ID
 * @apiError (Errors) 443791 Not valid emoji set id
 * @apiError (Errors) 443708 Emoji not found
 * @apiError (Errors) 443606 Image file input error
 * @apiError (Errors) 443607 Only image files allowed
 * @apiError (Errors) 443609 Image file extension/type not allowed
 * @apiError (Errors) 443796 Can not revert to not deprecated
 * @apiError (Errors) 4000007 Token invalid
 */

router.patch(
  "/:setId/:emojiId",
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
          message: `EditEmojiInSetController - input is not multipart form data`,
        });
      }

      const emojiSetId = request.params.setId;
      const emojiId = request.params.emojiId;

      if (!emojiSetId) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeNoEmojiSetId,
          message: "EditEmojiInSetController - no emoji set id",
        });
      }

      if (!emojiId) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeNoEmojiId,
          message: "EditEmojiInSetController - no emoji id",
        });
      }

      let emojiSet = await EmojiSet.findOne({ _id: emojiSetId }).lean();

      if (!emojiSet) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeNotValidEmojiSetId,
          message: "EditEmojiInSetController - not valid emoji set id",
        });
      }

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
          message: "EditEmojiInSetController - not valid emoji id",
        });
      }
      const { fields = {}, files = {} } = await Utils.formParse(request, {
        keepExtensions: true,
        type: "multipart",
        multiples: true,
        uploadDir: Config.uploadPath,
      });

      console.log("fields files", fields, files);

      const { name, animate, isDeprecated, shouldRemoveSmallImage } = fields;

      if (name && emojiInSet.items[0].name !== name) emojiInSet.items[0].name = name;

      if (animate && emojiInSet.items[0].animate !== Boolean(+animate))
        emojiInSet.items[0].animate = Boolean(+animate);

      if (isDeprecated && emojiInSet.items[0].isDeprecated !== Boolean(Number(isDeprecated))) {
        if (Boolean(Number(isDeprecated)) === false && emojiInSet.items[0].isDeprecated === true) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeCantRevertToNotDeprecated,
            message: `EditEmojiInSetController - can not revert to not deprecated`,
          });
        }
        emojiInSet.items[0].isDeprecated = Boolean(Number(isDeprecated));
        await EmojiSet.updateOne(
          { _id: emojiSetId },
          { $set: { itemsCount: emojiSet.itemsCount - 1 } },
        );
      }

      const filesObject = {};
      const fileKeys = Object.keys(files);

      if (fileKeys.length > 0) {
        for (let i = 0; i < fileKeys.length; i++) {
          const file = files[fileKeys[i]];
          const fileMimeType = file.type;

          if (fileMimeType.indexOf("image") === -1) {
            return Base.newErrorResponse({
              response,
              code: Const.responsecodeOnlyImageFilesAllowed,
              message: `EditEmojiInSetController - only image files allowed`,
            });
          }

          const { fileData, code } = await Utils.handleImageFile(file, "emojis");
          if (code === 123) {
            return Base.newErrorResponse({
              response,
              code: Const.responsecodeExtensionNotAllowed,
              message: `EditEmojiInSetController - image extension not allowed`,
            });
          }
          filesObject[fileKeys[i]] = fileData;
        }
      }

      const { smallImage, bigImage } = filesObject;

      if (smallImage) {
        const filePathSmallImage = path.resolve(
          Config.uploadPath,
          `emojis/${emojiInSet.items[0].smallImage.nameOnServer}`,
        );
        await fsp.unlink(filePathSmallImage);
        emojiInSet.items[0].smallImage = smallImage;
      }

      if (bigImage) {
        const filePathBigImage = path.resolve(
          Config.uploadPath,
          `emojis/${emojiInSet.items[0].bigImage.nameOnServer}`,
        );
        await fsp.unlink(filePathBigImage);
        emojiInSet.items[0].bigImage = bigImage;
      }

      // if shouldRemoveSmallImage is true, then remove small image and create new small image from the existing or new big image
      if (shouldRemoveSmallImage) {
        const bigImagePath = path.resolve(
          Config.uploadPath,
          `emojis/${emojiInSet.items[0].bigImage.nameOnServer}`,
        );
        const smallImageFileName = Utils.getRandomString(32) + ".webp";
        const smallImagePath = path.resolve(Config.uploadPath, `emojis/${smallImageFileName}`);

        const resizedImage = await Utils.resizeImage(bigImagePath, smallImagePath, 100, 100);

        if (emojiInSet.items[0].smallImage) {
          const filePathSmallImage = path.resolve(
            Config.uploadPath,
            `emojis/${emojiInSet.items[0].smallImage.nameOnServer}`,
          );
          await fsp.unlink(filePathSmallImage);
        }

        emojiInSet.items[0].smallImage = {
          originalFileName: emojiInSet.items[0].bigImage.nameOnServer,
          nameOnServer: smallImageFileName,
          mimeType: "image/webp",
          size: resizedImage.size,
          height: resizedImage.height,
          width: resizedImage.width,
          aspectRatio: resizedImage.height / resizedImage.width,
        };
      }

      emojiInSet.items[0].modified = Date.now();

      await EmojiSet.updateOne(
        { _id: emojiSetId, "items._id": new mongoose.Types.ObjectId(emojiId) },
        { $set: { "items.$": emojiInSet.items[0] } },
      );

      Base.successResponse(response, Const.responsecodeSucceed);
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "EditEmojiInSetController",
        error,
      });
    }
  },
);

module.exports = router;
