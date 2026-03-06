"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const, Config } = require("#config");
const { File } = require("#models");
const mediaHandler = require("#media");
const fs = require("fs");
const fsp = require("fs/promises");
const formidable = require("formidable");
const easyimg = require("easyimage");

/**
 * @api {get} /api/v2/file/upload upload file
 * @apiName File Upload
 * @apiGroup WebAPI
 * @apiDescription Returns fileId
 **/

router.post("", async function (request, response) {
  try {
    const form = new formidable.IncomingForm();
    form.maxFieldsSize = 50 * 1024 * 1024;
    form.maxTotalFileSize = 50 * 1024 * 1024;
    form.multiples = true;

    if (!fs.existsSync(Config.uploadPath)) {
      logger.error("FileUploadController, upload dir doesnt exist");
      Base.errorResponse(
        response,
        Const.httpCodeServerError,
        "FileUploadController",
        "Upload dir doesnt exist",
      );
      return;
    }

    const { fields, files } = await form.parse(request);

    if (Object.keys(files).length === 0) {
      Base.successResponse(response, Const.responsecodeMessageFileUploadFailed);
      return;
    }

    const file = files[Object.keys(files)[0]];

    if (!file) {
      Base.successResponse(response, Const.responsecodeMessageFileUploadFailed);
      return;
    }

    let mediaDuration;
    if (file.type.indexOf("audio") > -1 || file.type.indexOf("video") > -1) {
      try {
        const info = await mediaHandler.getMediaInfo(file.path);
        mediaDuration = info.duration;
      } catch (err) {
        logger.error("FileUploadController", err);
      }
    }

    const newFile = await File.create({
      name: file.name,
      mimeType: file.type,
      size: file.size,
      created: Date.now(),
      ...(mediaDuration && { duration: mediaDuration }),
    });

    const tempPath = file.path;
    let destPath = Config.uploadPath + "/" + newFile._id.toString();
    if (file.type.indexOf("video") > -1) {
      destPath += file.name.substr(file.name.lastIndexOf("."));
    }

    await fsp.copyFile(tempPath, destPath);

    let thumbModel;
    if (
      file.type.indexOf("jpeg") > -1 ||
      file.type.indexOf("gif") > -1 ||
      file.type.indexOf("png") > -1
    ) {
      const tempThumbFileName = newFile._id + "_thumb.jpg"; // force to be jpg
      const destPathTmp = Config.uploadPath + "/" + tempThumbFileName;

      try {
        await easyimg.thumbnail({
          src: file.path,
          dst: destPathTmp,
          width: 256,
          height: 256,
        });

        thumbModel = await File.create({
          name: "thumb_" + file.name,
          mimeType: "image/jpeg",
          size: (await fsp.stat(destPathTmp)).size,
          created: Date.now(),
        });

        const thumbDestPath = Config.uploadPath + "/" + thumbModel._id.toString();
        await fsp.rename(destPathTmp, thumbDestPath);
      } catch (err) {
        logger.error("FileUploadController", err);
      }
    }

    const responseJson = {
      file: {
        id: newFile._id,
        name: newFile.name,
        size: newFile.size,
        mimeType: newFile.mimeType,
        ...(mediaDuration && { duration: mediaDuration }),
      },
      ...(thumbModel && {
        thumb: {
          id: thumbModel._id,
          name: thumbModel.name,
          size: thumbModel.size,
          mimeType: thumbModel.mimeType,
        },
      }),
    };

    return Base.successResponse(response, Const.responsecodeSucceed, responseJson);
  } catch (error) {
    return Base.errorResponse(response, Const.httpCodeServerError, "FileUploadController", error);
  }
});

module.exports = router;
