"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { File } = require("#models");
const mediaHandler = require("#media");
const fsp = require("fs/promises");
const formidable = require("formidable");
const easyimg = require("easyimage");

/**
 * @api {post} /api/v2/file/upload/multiple multiple file upload
 * @apiName Multiple File Upload
 * @apiGroup WebAPI
 * @apiDescription Returns list of fileModels
 **/
router.post("", async function (request, response) {
  try {
    const form = new formidable.IncomingForm();
    form.maxFieldsSize = 500 * 1024 * 1024;
    form.maxTotalFileSize = 500 * 1024 * 1024;
    form.multiples = true;

    //list of file models
    const fileModelsToBeReturned = [];
    //stores the total number of files
    let numberOfFiles;
    //counter will increase after each file is read
    let counter = 0;

    form.parse(request, async function (err, fields, files) {
      if (!files.file) {
        Base.successResponse(response, Const.responsecodeMessageFileUploadFailed);
        return;
      } else if (!files.file.length) {
        //case: only one file
        //files.file.lenght is undefined when only one file is being uploaded
        numberOfFiles = 1;
      } else {
        numberOfFiles = files.file.length;
        logger.info("number of files: " + numberOfFiles);
      }
    });

    form.on("file", function (name, file) {
      processFile(name, file);
    });

    form.on("end", async function (name, file) {});

    const processFile = async (name, file) => {
      var mediaDuration;
      var newFile;

      if (file.type.indexOf("audio") > -1 || file.type.indexOf("video") > -1) {
        mediaHandler.getMediaInfo(file.path).then((info) => {
          mediaDuration = info.duration;
        });
        //save to database
        newFile = new File({
          name: file.name,
          mimeType: file.mimetype,
          size: file.size,
          created: Date.now(),
          duration: mediaDuration,
        });

        let id;

        const res = await newFile.save();

        id = res._doc._id;

        let objectForResponse = {};

        objectForResponse.file = {
          id: id,
          name: res._doc.name,
          size: res._doc.size,
          mimeType: file.type,
          duration: mediaDuration,
        };

        fileModelsToBeReturned.push(objectForResponse);

        var destPath = Config.uploadPath + "/" + id.toString();

        if (file.type.indexOf("video") > -1)
          destPath += file.name.substr(file.name.lastIndexOf("."));

        await fsp.copyFile(file.path, destPath);
      } else if (
        file.type.indexOf("jpg") > -1 ||
        file.type.indexOf("gif") > -1 ||
        file.type.indexOf("png") > -1
      ) {
        newFile = new File({
          name: file.name,
          mimeType: file.type,
          size: file.size,
          created: Date.now(),
        });

        let thumbType;
        let objectForResponse = {};

        const res = await newFile.save();

        id = res._doc._id;
        thumbType = res._doc.mimeType;

        objectForResponse.file = {
          id: id,
          name: res._doc.name,
          size: res._doc.size,
          mimeType: res._doc.mimeType,
        };

        let destPath = Config.uploadPath + "/" + id.toString();

        await fsp.copyFile(file.path, destPath);

        let tempThumbFileName = id + "_thumb.jpg"; // force to be jpg

        logger.info("tempThumbFileName " + tempThumbFileName);

        let destPathTmp = Config.uploadPath + "/" + tempThumbFileName;

        const image = await easyimg.thumbnail({
          src: file.path,
          dst: destPathTmp,
          width: 256,
          height: 256,
        });

        // save to database
        var thumbObj = new File({
          name: "thumb_" + file.name,
          mimeType: thumbType,
          size: image.size,
          created: Date.now(),
        });

        const resThumb = await thumbObj.save();

        let thumbFileName = resThumb._doc._id;
        destPath = Config.uploadPath + "/" + thumbFileName;

        objectForResponse.thumb = {
          id: resThumb._doc._id,
          name: resThumb._doc.name,
          size: resThumb._doc.size,
          mimeType: resThumb._doc.mimeType,
        };

        fileModelsToBeReturned.push(objectForResponse);

        logger.info("Models read:");
        logger.info(fileModelsToBeReturned);

        // rename
        await fsp.rename(destPathTmp, destPath, function () {});
      } else {
        newFile = new File({
          name: file.name,
          mimeType: file.type,
          size: file.size,
          created: Date.now(),
        });

        var res = await newFile.save();

        var id = res._doc._id;

        var objectForResponse = {};

        objectForResponse.file = {
          id: id,
          name: res._doc.name,
          size: res._doc.size,
          mimeType: file.type,
        };

        fileModelsToBeReturned.push(objectForResponse);

        let destPath = Config.uploadPath + "/" + id.toString();

        await fsp.copyFile(file.path, destPath);
      }

      //increase counter and check if all the files are read
      counter++;

      //if all the files is read, send response
      if (counter === numberOfFiles) {
        Base.successResponse(response, Const.responsecodeSucceed, fileModelsToBeReturned);
      }
    };
  } catch (error) {
    Base.errorResponse(response, Const.httpCodeServerError, "MultipleFileUploadController", error);
  }
});

module.exports = router;
