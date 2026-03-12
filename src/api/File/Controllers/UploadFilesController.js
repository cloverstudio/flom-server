"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { FlomFile } = require("#models");
const fsp = require("fs/promises");
const { handleAudioFile, handleImageFile, handleVideoFile } = require("../../Product/helpers");

/**
 * @api {post} /api/v2/files Upload Files flom_v1
 * @apiVersion 2.0.26
 * @apiName  Upload Files flom_v1
 * @apiGroup WebAPI File
 * @apiDescription  Upload one or multiple files. File models in response won't have any information except _id, created, mimeType, and mediaProcessingInfo. I have listed the rest of the parameters and marked them as not returned.
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiParam (Form data) {File} file file
 *
 * @apiSuccessExample Success Response
 * {
 *   "code": 1,
 *   "time": 1590000125608,
 *   "data": {
 *     "files": [
 *       {
 *         "file": {
 *           "_id": "66f29a1f866550291acd5864",
 *           "created": 1590000125608,
 *           "mimeType": "video/mp4",
 *           "mediaProcessingInfo": {
 *             "status": "processing"
 *           },
 *           "size": 1590000125608, (not in response)
 *           "name": "name", (not in response)
 *           "duration": 1590000125608, (not in response) (only for video and audio)
 *         },
 *         "thumb": { (only for video and images)
 *           "_id": "66f29a1f866550291acd5863",
 *           "created": 1590000125608,
 *           "mimeType": "image/webp",
 *           "mediaProcessingInfo": {
 *             "status": "processing"
 *           },
 *           "size": 1590000125608, (not in response)
 *           "name": "name", (not in response)
 *         },
 *         "hsl": { (only for video and audio)
 *           "_id": "66f29a1f866550291acd5862",
 *           "created": 1590000125608,
 *           "mimeType": "video/mp4",
 *           "mediaProcessingInfo": {
 *             "status": "processing"
 *           },
 *           "size": 1590000125608, (not in response)
 *           "name": "name", (not in response)
 *           "duration": 1590000125608, (not in response) (only for video and audio)
 *         },
 *         "webm": { (only for video)
 *           "_id": "66f29a1f866550291acd5862",
 *           "created": 1590000125608,
 *           "mimeType": "video/webm",
 *           "mediaProcessingInfo": {
 *             "status": "processing"
 *           },
 *           "size": 1590000125608, (not in response)
 *           "name": "name", (not in response)
 *           "duration": 1590000125608, (not in response) (only for video and audio)
 *         }
 *       }
 *     ]
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443391 No files uploaded
 * @apiError (Errors) 4000007 Token invalid
 */

router.post("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const { files = {} } = await Utils.formParse(request, { keepExtensions: true });
    console.log("UploadFilesController files", Object.keys(files));

    if (Object.keys(files).length === 0) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeFileNotFound,
        message: "UploadFilesController, no files uploaded",
      });
    }

    const filesToReturn = [];

    for (const key in files) {
      const file = files[key];

      const fileToReturn = {};

      const splitFileName = file.name.split(".");
      const originalFileExtension = splitFileName[splitFileName.length - 1];
      const fileType = file.type;

      if (fileType.includes("image")) {
        const newName = Utils.getRandomString(32);
        const fileObj = {
          name: newName + (originalFileExtension === "webp" ? ".webp" : ".jpg"),
          created: Date.now(),
          mimeType: fileType.includes("webp") ? "image/webp" : "image/jpeg",
          mediaProcessingInfo: { status: "processing" },
        };
        const newFile = await FlomFile.create(fileObj);
        file.fileId = newFile._id.toString();
        file.newName = newName;

        fileToReturn.file = newFile.toObject();

        const newThumbName = Utils.getRandomString(32);
        const thumbObj = {
          name: newThumbName + (originalFileExtension === "webp" ? ".webp" : ".jpg"),
          created: Date.now(),
          mimeType: fileType.includes("webp") ? "image/webp" : "image/jpeg",
          mediaProcessingInfo: { status: "processing" },
        };
        const thumb = await FlomFile.create(thumbObj);
        file.thumbId = thumb._id.toString();
        file.newThumbName = newThumbName;

        fileToReturn.thumb = thumb.toObject();
      } else if (fileType.includes("audio")) {
        const newName = Utils.getRandomString(32);
        const fileObj = {
          name: newName + ".mp3",
          created: Date.now(),
          mimeType: "audio/mpeg",
          mediaProcessingInfo: { status: "processing" },
        };
        const newFile = await FlomFile.create(fileObj);
        file.fileId = newFile._id.toString();
        file.newName = newName;

        fileToReturn.file = newFile.toObject();

        const newHslName = Utils.getRandomString(32);
        const hslObj = {
          name: newHslName + ".m3u8",
          created: Date.now(),
          mimeType: "audio/mpeg",
          mediaProcessingInfo: { status: "processing" },
        };
        const hsl = await FlomFile.create(hslObj);
        file.hslId = hsl._id.toString();
        file.newHslName = newHslName;

        fileToReturn.hsl = hsl.toObject();
      } else if (fileType.includes("video")) {
        const newName = Utils.getRandomString(32);
        const fileObj = {
          name: newName + ".mp4",
          created: Date.now(),
          mimeType: "video/mp4",
          mediaProcessingInfo: { status: "processing" },
        };
        const newFile = await FlomFile.create(fileObj);
        file.fileId = newFile._id.toString();
        file.newName = newName;

        fileToReturn.file = newFile.toObject();

        const newThumbName = Utils.getRandomString(32);
        const thumbObj = {
          name: newThumbName + ".jpg",
          created: Date.now(),
          mimeType: "image/jpeg",
          mediaProcessingInfo: { status: "processing" },
        };
        const thumb = await FlomFile.create(thumbObj);
        file.thumbId = thumb._id.toString();
        file.newThumbName = newThumbName;

        fileToReturn.thumb = thumb.toObject();

        const newHslName = Utils.getRandomString(32);
        const hslObj = {
          name: newHslName + ".m3u8",
          created: Date.now(),
          mimeType: "video/mp4",
          mediaProcessingInfo: { status: "processing" },
        };
        const hsl = await FlomFile.create(hslObj);
        file.hslId = hsl._id.toString();
        file.newHslName = newHslName;

        fileToReturn.hsl = hsl.toObject();

        const webmObj = {
          name: newHslName + ".mpd",
          created: Date.now(),
          mimeType: "video/webm",
          mediaProcessingInfo: { status: "processing" },
        };
        const webm = await FlomFile.create(webmObj);
        file.webmId = webm._id.toString();

        fileToReturn.webm = webm.toObject();
      } else {
        const newName = Utils.getRandomString(32);
        const fileObj = {
          name: newName + "." + originalFileExtension,
          size: file.size,
          mimeType: file.type,
          created: Date.now(),
          mediaProcessingInfo: { status: "completed" },
        };
        const newFile = await FlomFile.create(fileObj);

        fileToReturn.file = newFile.toObject();

        await fsp.copyFile(file.path, Config.uploadPath + "/" + fileObj.name);
      }

      filesToReturn.push(fileToReturn);
    }

    Base.successResponse(response, Const.responsecodeSucceed, { files: filesToReturn });

    try {
      for (const key in files) {
        const file = files[key];
        const fileMimeType = file.type;

        let handleFunction = null;

        if (fileMimeType.includes("image")) handleFunction = handleImageFile;
        else if (fileMimeType.includes("audio")) handleFunction = handleAudioFile;
        else if (fileMimeType.includes("video")) handleFunction = handleVideoFile;
        else continue;

        const { fileId, thumbId, hslId, webmId } = file;

        let fileData;
        try {
          fileData = await handleFunction(file);
        } catch (error) {
          if (fileId) {
            await FlomFile.findByIdAndUpdate(fileId, {
              "mediaProcessingInfo.status": "failed",
              "mediaProcessingInfo.error": error.message,
            });
          }

          if (thumbId) {
            await FlomFile.findByIdAndUpdate(thumbId, {
              "mediaProcessingInfo.status": "failed",
              "mediaProcessingInfo.error": error.message,
            });
          }

          if (hslId) {
            await FlomFile.findByIdAndUpdate(hslId, {
              "mediaProcessingInfo.status": "failed",
              "mediaProcessingInfo.error": error.message,
            });
          }

          if (webmId) {
            await FlomFile.findByIdAndUpdate(webmId, {
              "mediaProcessingInfo.status": "failed",
              "mediaProcessingInfo.error": error.message,
            });
          }

          throw error;
        }

        if (fileId) {
          const fileUpdate = {
            mimeType: fileData.file.mimeType,
            size: fileData.file.size,
            ...(fileData.file.duration && { duration: fileData.file.duration }),
            "mediaProcessingInfo.status": "completed",
          };

          await FlomFile.findByIdAndUpdate(fileId, fileUpdate);
        }

        if (thumbId) {
          const thumbUpdate = {
            mimeType: fileData.thumb.mimeType,
            size: fileData.thumb.size,
            "mediaProcessingInfo.status": "completed",
          };

          await FlomFile.findByIdAndUpdate(thumbId, thumbUpdate);
        }

        if (hslId) {
          const hslUpdate = {
            mimeType: fileData.file.mimeType,
            size: fileData.file.size,
            ...(fileData.file.duration && { duration: fileData.file.duration }),
            "mediaProcessingInfo.status": "completed",
          };

          await FlomFile.findByIdAndUpdate(hslId, hslUpdate);
        }

        if (webmId) {
          const webmUpdate = {
            mimeType: fileData.webm_av1_sd.mimeType,
            size: fileData.webm_av1_sd.size,
            duration: fileData.webm_av1_sd.duration,
            "mediaProcessingInfo.status": "completed",
          };

          await FlomFile.findByIdAndUpdate(webmId, webmUpdate);
        }
      }
    } catch (error) {
      logger.error("UploadFilesController, processing", error);
    }

    return;
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "UploadFilesController",
      error,
    });
  }
});

module.exports = router;
