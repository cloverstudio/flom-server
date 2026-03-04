"use strict";

const fsp = require("fs/promises");
const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { Sound } = require("#models");

/**
 * @api {get} /api/v2/admin-page/sounds/:id Get sound flom_v1
 * @apiVersion 2.0.16
 * @apiName  Get sound flom_v1
 * @apiGroup WebAPI Admin page - Sounds
 * @apiDescription  API which is called to get the database entry for a sound.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1700058064142,
 *     "data": {
 *         "sound": {
 *             "audio": {
 *                 "originalFileName": "typical-trap-loop-2b-130751.mp3",
 *                 "nameOnServer": "FQzDRfeWmrmUMtrW01FKoIDdFxjUt1hk.mp3",
 *                 "mimeType": "audio/mpeg",
 *                 "duration": 7,
 *                 "size": 220682,
 *                 "hslName": "zZC6M8Uh8WOgEWLDO4c6tdhb46XkMNtX"
 *             },
 *             "thumbnail": {
 *                 "originalFileName": "UERGOV55N7eEQYahVhAm4UGQ236BGeAO.webp",
 *                 "nameOnServer": "UERGOV55N7eEQYahVhAm4UGQ236BGeAO.webp",
 *                 "mimeType": "image/webp",
 *                 "size": 7860,
 *                 "height": 259,
 *                 "width": 194,
 *                 "aspectRatio": 1.3350515463917525
 *             },
 *             "created": 1700058064088,
 *             "createdReadable": "2023-11-15T14:20:58.776Z",
 *             "modified": 1700058064088,
 *             "modifiedReadable": "2023-11-15T14:20:58.776Z",
 *             "_id": "6554d3d026bfe033a82d9d37",
 *             "title": "7",
 *             "artist": "7",
 *             "duration": "7",
 *             "audioUrl": "https://v1.flom.dev/api/v2/sounds/FQzDRfeWmrmUMtrW01FKoIDdFxjUt1hk.mp3",
 *             "thumbnailUrl": "https://v1.flom.dev/api/v2/sounds/UERGOV55N7eEQYahVhAm4UGQ236BGeAO.webp",
 *             "hslUrl": "https://v1.flom.dev/api/v2/sounds/tiruririrururirieiendfienef.m3u8",
 *             "__v": 0
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
 * @apiError (Errors) 443830 Sound with given id not found
 * @apiError (Errors) 4000007 Token invalid
 */

router.get(
  "/:id",
  auth({ allowAdmin: true, role: Const.Role.ADMIN }),
  async (request, response) => {
    try {
      const { id: soundId } = request.params;

      const sound = await Sound.findById(soundId).lean();
      if (!sound) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeSoundNotFound,
          message: `AdminSoundController, GET - sound with given id not found`,
        });
      }

      addLinks(sound);

      Base.successResponse(response, Const.responsecodeSucceed, { sound });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "AdminSoundController, GET by id",
        error,
      });
    }
  },
);

/**
 * @api {post} /api/v2/admin-page/sounds Create sound flom_v1
 * @apiVersion 2.0.16
 * @apiName  Create sound flom_v1
 * @apiGroup WebAPI Admin page - Sounds
 * @apiDescription  API which is called to create a sound.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiParam {String} title        Title of sound
 * @apiParam {String} artist       Name of artist of sound
 * @apiParam {File}   audio        Audio file for sound
 * @apiParam {File}   [thumbnail]  Image file for thumbnail
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1700058064142,
 *     "data": {
 *         "sound": {
 *             "audio": {
 *                 "originalFileName": "typical-trap-loop-2b-130751.mp3",
 *                 "nameOnServer": "FQzDRfeWmrmUMtrW01FKoIDdFxjUt1hk.mp3",
 *                 "mimeType": "audio/mpeg",
 *                 "duration": 7,
 *                 "size": 220682,
 *                 "hslName": "zZC6M8Uh8WOgEWLDO4c6tdhb46XkMNtX"
 *             },
 *             "thumbnail": {
 *                 "originalFileName": "UERGOV55N7eEQYahVhAm4UGQ236BGeAO.webp",
 *                 "nameOnServer": "UERGOV55N7eEQYahVhAm4UGQ236BGeAO.webp",
 *                 "mimeType": "image/webp",
 *                 "size": 7860,
 *                 "height": 259,
 *                 "width": 194,
 *                 "aspectRatio": 1.3350515463917525
 *             },
 *             "created": 1700058064088,
 *             "createdReadable": "2023-11-15T14:20:58.776Z",
 *             "modified": 1700058064088,
 *             "modifiedReadable": "2023-11-15T14:20:58.776Z",
 *             "_id": "6554d3d026bfe033a82d9d37",
 *             "title": "7",
 *             "artist": "7",
 *             "duration": "7",
 *             "audioUrl": "https://v1.flom.dev/api/v2/sounds/FQzDRfeWmrmUMtrW01FKoIDdFxjUt1hk.mp3",
 *             "thumbnailUrl": "https://v1.flom.dev/api/v2/sounds/UERGOV55N7eEQYahVhAm4UGQ236BGeAO.webp",
 *             "hslUrl": "https://v1.flom.dev/api/v2/sounds/tiruririrururirieiendfienef.m3u8",
 *             "__v": 0
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
 * @apiError (Errors) 443831 No sound title
 * @apiError (Errors) 443832 No sound artist
 * @apiError (Errors) 443833 No audio file sent
 * @apiError (Errors) 443835 Audio extension not allowed
 * @apiError (Errors) 443609 Extension not allowed
 * @apiError (Errors) 4000007 Token invalid
 */

router.post("/", auth({ allowAdmin: true, role: Const.Role.ADMIN }), async (request, response) => {
  try {
    const { fields = {}, files = {} } = await Utils.formParse(request, {
      keepExtensions: true,
      type: "multipart",
      multiples: true,
      uploadDir: Config.uploadPath,
    });

    const { title, artist } = fields;

    if (!title) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoSoundTitle,
        message: `AdminSoundController, POST - no sound title`,
      });
    }
    if (!artist) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoSoundArtist,
        message: `AdminSoundController, POST - no sound artist`,
      });
    }

    const audio = files["audio"];
    const thumbnail = files["thumbnail"];

    if (!audio) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoAudioFile,
        message: `AdminSoundController, POST - no audio file sent`,
      });
    }

    const { code: codeAudio, fileData: audioData } = await Utils.handleAudioFile({
      file: audio,
      dir: "sounds",
      allowedExtensions: "mp3",
    });
    if (codeAudio) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeAudioExtensionNotAllowed,
        message: `AdminSoundController, POST - audio extension not allowed`,
      });
    }

    let thumbData = null;
    if (thumbnail) {
      const { code: codeThumb, fileData } = await Utils.handleImageFile(thumbnail, "sounds");
      if (codeThumb === "123") {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeExtensionNotAllowed,
          message: `AdminSoundController, POST - image extension not allowed`,
        });
      }

      thumbData = fileData;
    }

    const info = {
      title,
      artist,
      duration: audioData.duration,
      audio: audioData,
      thumbnail: thumbData,
      created: Date.now(),
      createdReadable: new Date().toISOString(),
    };

    const result = (await Sound.create(info)).toObject();

    addLinks(result);

    Base.successResponse(response, Const.responsecodeSucceed, { sound: result });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "AdminSoundController, POST",
      error,
    });
  }
});

/**
 * @api {patch} /api/v2/admin-page/sounds/:id Update sound flom_v1
 * @apiVersion 2.0.16
 * @apiName  Update sound flom_v1
 * @apiGroup WebAPI Admin page - Sounds
 * @apiDescription  API which is called to update a sound.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiParam {String}   [title]         Title of sound
 * @apiParam {String}   [artist]        Name of artist of sound
 * @apiParam {File}     [audio]         Audio file for sound
 * @apiParam {File}     [thumbnail]     Image file for thumbnail
 * @apiParam {Number}   [deleteAudio]   Delete audio: any character for yes, do not send for no
 * @apiParam {Number}   [deleteThumb]   Delete thumbnail: any character for yes, do not send for no
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1700058064142,
 *     "data": {
 *         "updatedSound": {
 *             "audio": {
 *                 "originalFileName": "typical-trap-loop-2b-130751.mp3",
 *                 "nameOnServer": "FQzDRfeWmrmUMtrW01FKoIDdFxjUt1hk.mp3",
 *                 "mimeType": "audio/mpeg",
 *                 "duration": 7,
 *                 "size": 220682,
 *                 "hslName": "zZC6M8Uh8WOgEWLDO4c6tdhb46XkMNtX"
 *             },
 *             "thumbnail": {
 *                 "originalFileName": "UERGOV55N7eEQYahVhAm4UGQ236BGeAO.webp",
 *                 "nameOnServer": "UERGOV55N7eEQYahVhAm4UGQ236BGeAO.webp",
 *                 "mimeType": "image/webp",
 *                 "size": 7860,
 *                 "height": 259,
 *                 "width": 194,
 *                 "aspectRatio": 1.3350515463917525
 *             },
 *             "created": 1700058064088,
 *             "createdReadable": "2023-11-15T14:20:58.776Z",
 *             "modified": 1700058064088,
 *             "modifiedReadable": "2023-11-15T14:20:58.776Z",
 *             "_id": "6554d3d026bfe033a82d9d37",
 *             "title": "7",
 *             "artist": "7",
 *             "duration": "7",
 *             "audioUrl": "https://v1.flom.dev/api/v2/sounds/FQzDRfeWmrmUMtrW01FKoIDdFxjUt1hk.mp3",
 *             "thumbnailUrl": "https://v1.flom.dev/api/v2/sounds/UERGOV55N7eEQYahVhAm4UGQ236BGeAO.webp",
 *             "hslUrl": "https://v1.flom.dev/api/v2/sounds/tiruririrururirieiendfienef.m3u8",
 *             "__v": 0
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
 * @apiError (Errors) 443830 Sound with given id not found
 * @apiError (Errors) 443833 More than one audio file sent
 * @apiError (Errors) 443609 Extension not allowed
 * @apiError (Errors) 443835 Audio extension not allowed
 * @apiError (Errors) 4000007 Token invalid
 */

router.patch(
  "/:id",
  auth({ allowAdmin: true, role: Const.Role.ADMIN }),
  async (request, response) => {
    try {
      const { id: soundId } = request.params;
      const updateObj = {
        $set: { modified: Date.now(), modifiedReadable: new Date().toISOString() },
      };
      const deleteObj = {};

      const oldSound = await Sound.findById(soundId).lean();
      if (!oldSound) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeSoundNotFound,
          message: `AdminSoundController, PATCH - sound with given id not found`,
        });
      }

      const { fields = {}, files = {} } = await Utils.formParse(request, {
        keepExtensions: true,
        type: "multipart",
        multiples: true,
        uploadDir: Config.uploadPath,
      });

      const { title, artist, deleteAudio, deleteThumb } = fields;

      if (title) updateObj.$set.title = title;
      if (artist) updateObj.$set.artist = artist;
      if (deleteAudio) deleteObj.audio = 1;
      if (deleteThumb) deleteObj.thumbnail = 1;

      const audio = files["audio"];
      const thumbnail = files["thumbnail"];

      if (audio) {
        const { code: codeAudio, fileData: audioData } = await Utils.handleAudioFile({
          file: audio,
          dir: "sounds",
          allowedExtensions: "mp3",
        });
        if (codeAudio) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeAudioExtensionNotAllowed,
            message: `AdminSoundController, PATCH - audio extension not allowed`,
          });
        }

        updateObj.$set.audio = audioData;
        updateObj.$set.duration = audioData.duration;
      }

      if (thumbnail) {
        const { code: codeThumb, fileData } = await Utils.handleImageFile(thumbnail, "sounds");
        if (codeThumb === "123") {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeExtensionNotAllowed,
            message: `AdminSoundController, PATCH - image extension not allowed`,
          });
        }

        updateObj.$set.thumbnail = fileData;
      }

      if (Object.keys(deleteObj).length > 0) {
        updateObj["$unset"] = deleteObj;
      }

      const result = (await Sound.findByIdAndUpdate(soundId, updateObj, { new: true })).toObject();

      addLinks(result);
      await deleteSoundFiles({
        sound: oldSound,
        deleteAudio: !!audio || !!deleteAudio,
        deleteThumb: !!thumbnail || !!deleteThumb,
      });

      Base.successResponse(response, Const.responsecodeSucceed, {
        updatedSound: result,
      });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "AdminSoundController, PATCH",
        error,
      });
    }
  },
);

/**
 * @api {delete} /api/v2/admin-page/sounds/:id Delete sound flom_v1
 * @apiVersion 2.0.16
 * @apiName  Delete sound flom_v1
 * @apiGroup WebAPI Admin page - Sounds
 * @apiDescription  API which is called to delete a sound.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1700058064142,
 *     "data": {
 *         "deletedSound": {
 *             "audio": {
 *                 "originalFileName": "typical-trap-loop-2b-130751.mp3",
 *                 "nameOnServer": "FQzDRfeWmrmUMtrW01FKoIDdFxjUt1hk.mp3",
 *                 "mimeType": "audio/mpeg",
 *                 "duration": 7,
 *                 "size": 220682,
 *                 "hslName": "zZC6M8Uh8WOgEWLDO4c6tdhb46XkMNtX"
 *             },
 *             "thumbnail": {
 *                 "originalFileName": "UERGOV55N7eEQYahVhAm4UGQ236BGeAO.webp",
 *                 "nameOnServer": "UERGOV55N7eEQYahVhAm4UGQ236BGeAO.webp",
 *                 "mimeType": "image/webp",
 *                 "size": 7860,
 *                 "height": 259,
 *                 "width": 194,
 *                 "aspectRatio": 1.3350515463917525
 *             },
 *             "created": 1700058064088,
 *             "createdReadable": "2023-11-15T14:20:58.776Z",
 *             "modified": 1700058064088,
 *             "modifiedReadable": "2023-11-15T14:20:58.776Z",
 *             "_id": "6554d3d026bfe033a82d9d37",
 *             "title": "7",
 *             "artist": "7",
 *             "duration": "7",
 *             "__v": 0
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
 * @apiError (Errors) 443830 Sound with given id not found
 * @apiError (Errors) 443834 No sound id given
 * @apiError (Errors) 4000007 Token invalid
 */

router.delete(
  "/:id",
  auth({ allowAdmin: true, role: Const.Role.ADMIN }),
  async (request, response) => {
    try {
      const { id: soundId } = request.params;

      if (!soundId) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeNoSoundId,
          message: "AdminSoundController, DELETE - no sound id",
        });
      }

      const sound = await Sound.findById(soundId).lean();
      if (!sound) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeSoundNotFound,
          message: `AdminSoundController, DELETE - sound with given id not found`,
        });
      }

      await deleteSoundFiles({ sound });

      const result = await Sound.findByIdAndDelete(soundId);

      Base.successResponse(response, Const.responsecodeSucceed, {
        deletedSound: result.toObject(),
      });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "AdminSoundController, DELETE",
        error,
      });
    }
  },
);

function addLinks(sound) {
  sound.audioUrl = Config.webClientUrl + `/api/v2/sounds/${sound.audio.nameOnServer}`;
  sound.hslUrl = Config.webClientUrl + `/api/v2/sounds/${sound.audio.hslName}` + ".m3u8";
  if (sound.thumbnail)
    sound.thumbnailUrl = Config.webClientUrl + `/api/v2/sounds/${sound.thumbnail.nameOnServer}`;
}

async function deleteSoundFiles({ sound, deleteAudio = true, deleteThumb = true }) {
  if (deleteAudio) {
    const {
      audio: { nameOnServer: audioFileName, hslName },
    } = sound;

    try {
      await fsp.unlink(Config.uploadPath + "/sounds/" + audioFileName);
    } catch (error) {
      logger.error("AdminSoundController, deleteSoundFiles", error);
    }

    const fileNames = await fsp.readdir(Config.uploadPath + "/sounds");

    for (const fileName in fileNames) {
      if (fileName.includes(hslName)) {
        try {
          await fsp.unlink(Config.uploadPath + "/sounds/" + fileName);
        } catch (error) {
          logger.error("AdminSoundController, deleteSoundFiles", error);
        }
      }
    }
  }

  if (sound.thumbnail && deleteThumb) {
    const {
      thumbnail: { nameOnServer: thumbFileName },
    } = sound;

    try {
      await fsp.unlink(Config.uploadPath + "/sounds/" + thumbFileName);
    } catch (error) {
      logger.error("AdminSoundController, deleteSoundFiles", error);
    }
  }
}

module.exports = router;
