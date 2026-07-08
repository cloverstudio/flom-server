"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, Config } = require("#config");
const { auth } = require("#middleware");
const { Business } = require("#models");
const Utils = require("#utils");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs/promises");

/**
 * @api {post} /api/v2/businesses/:businessId/avatar  Upload business avatar flom_v1
 * @apiVersion 2.0.34
 * @apiName  Upload business avatar
 * @apiGroup WebAPI Business
 * @apiDescription  API which is called to upload a new avatar for a business.
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiParam (Path parameter) {String} businessId  ID of the business
 * @apiParam (Form data)      {File}   avatar      Avatar image file
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1674130965377,
 *     "data": {
 *         "avatar": {
 *             "nameOnServer": "e1f2c3d4e5f6g7h8i9j0k1l2m3n4o5p6.png",
 *             "mimeType": "image/png",
 *             "originalName": "avatar.png",
 *             "size": 12345,
 *             "width": 500,
 *             "height": 500,
 *             "thumbnail": {
 *                 "nameOnServer": "e1f2c3d4e5f6g7h8i9j0k1l2m3n4o5p6_thumb.png",
 *                 "mimeType": "image/png",
 *                 "size": 6789,
 *                 "width": 300,
 *                 "height": 300
 *             }
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
 * @apiError (Errors) 443970 Invalid business id
 * @apiError (Errors) 443971 Business not found
 * @apiError (Errors) 443391 File not found
 * @apiError (Errors) 443392 File type not supported
 * @apiError (Errors) 4000007 Token invalid
 */

router.post("/:businessId/avatar", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;

    const businessId = request.params.businessId;

    if (!businessId || !Utils.isValidObjectId(businessId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidBusinessId,
        message: "BusinessAvatarController, upload avatar, invalid businessId",
      });
    }

    const business = await Business.findById(businessId).lean();

    if (!business || business.owner._id !== user._id.toString()) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeBusinessNotFound,
        message:
          "BusinessAvatarController, upload avatar, business not found or user is not the owner",
      });
    }

    const oldAvatar = business.avatar;

    const { fields, files } = await Utils.formParse(request);

    if (!files || !files.avatar) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeFileNotFound,
        message: "BusinessAvatarController, upload avatar, no file uploaded",
      });
    }

    const file = files.avatar;

    const { type, name, path: filePath, size } = file;

    if (!type.startsWith("image/")) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeFileTypeNotSupported,
        message: "BusinessAvatarController, upload avatar, invalid file type",
      });
    }

    const newName = Utils.getRandomString(32, "alpha");
    const formatted = {};
    formatted.nameOnServer = newName + path.extname(name);
    formatted.mimeType = type;
    formatted.originalName = name;
    formatted.size = size;

    const dimensions = await sharp(filePath).metadata();
    const { width, height } = dimensions;
    formatted.width = width;
    formatted.height = height;

    const thumbnailName = newName + "_thumb" + path.extname(name);
    await sharp(filePath)
      .resize(300, 300, { fit: "inside" })
      .toFile(Config.uploadPath + "/" + thumbnailName);
    const thumbnailDimensions = await sharp(Config.uploadPath + "/" + thumbnailName).metadata();
    formatted.thumbnail = {
      nameOnServer: thumbnailName,
      mimeType: type,
      size: thumbnailDimensions.size,
      width: thumbnailDimensions.width,
      height: thumbnailDimensions.height,
    };

    await fs.copyFile(filePath, Config.uploadPath + "/" + formatted.nameOnServer);
    await fs.unlink(filePath);

    await Business.findByIdAndUpdate(businessId, { avatar: formatted });

    if (oldAvatar) {
      try {
        await fs.unlink(Config.uploadPath + "/" + oldAvatar.nameOnServer);
        if (oldAvatar.thumbnail) {
          await fs.unlink(Config.uploadPath + "/" + oldAvatar.thumbnail.nameOnServer);
        }
      } catch (error) {
        console.error("Error deleting old avatar files:", error);
      }
    }

    return Base.successResponse(response, Const.responsecodeSucceed, { avatar: formatted });
  } catch (error) {
    return Base.newErrorResponse({
      response,
      code: Const.httpCodeServerError,
      message: "BusinessAvatarController, upload avatar",
      error,
    });
  }
});

module.exports = router;
