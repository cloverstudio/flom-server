"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const, Config } = require("#config");
const { auth } = require("#middleware");
const { Sound } = require("#models");
const fsp = require("fs/promises");

/**
 * @api {get} /api/v2/sounds/:fileName Get sound files flom_v1
 * @apiVersion 2.0.16
 * @apiName  Get sound audio file flom_v1
 * @apiGroup WebAPI Sounds
 * @apiDescription  API which is called to get the audio (mp3), hsl (m3u8) or thumbnail (webp) files of a sound.
 *
 * @apiHeader {String} access-token Users unique access token. Admin token allowed as well.
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443391 File not found
 * @apiError (Errors) 4000007 Token invalid
 */

/*  
    auth({
      allowAdmin: true,
      role: Const.Role.ADMIN,
      allowUser: true,
    }),
  */

router.get("/:fileName", async (request, response) => {
  try {
    const { fileName } = request.params;

    if (!fileName) {
      logger.error("SoundController, GET file, no filename");
      return Base.successResponse(response, Const.responsecodeFileNotFound);
    }

    const filePath = `${Config.uploadPath}/sounds/${fileName}`;

    try {
      await fsp.access(filePath, fsp.constants.R_OK);

      if (fileName.includes(".mp3")) response.contentType("audio/mpeg");
      // if (fileName.includes("m3u8")) response.contentType("application/x-mpegURL");
      if (fileName.includes(".webp")) response.contentType("image/webp");
      response.sendFile(filePath);
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }

      logger.error("SoundController, GET file, file not found");
      return Base.successResponse(response, Const.responsecodeFileNotFound);
    }
  } catch (error) {
    return Base.errorResponse(
      response,
      Const.httpCodeServerError,
      "SoundController, GET file",
      error,
    );
  }
});

/**
 * @api {get} /api/v2/sounds Get sounds list flom_v1
 * @apiVersion 2.0.16
 * @apiName  Get sounds list flom_v1
 * @apiGroup WebAPI Sounds
 * @apiDescription  API which is called to get a list of available sounds
 *
 * @apiHeader {String} access-token Users unique access token. Admin token allowed as well.
 *
 * @apiParam (Query string) {String} [artist]  Name of artist (search will be case insensitive)
 * @apiParam (Query string) {String} [title]   Title of sound (search will be case insensitive)
 * @apiParam (Query string) {String} [page]    Page number
 * @apiParam (Query string) {String} [size]    Page size (number of sounds shown per page) (default: 10)
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1700058064142,
 *     "data": {
 *         "sounds": [
 *             {
 *                 "audio": {
 *                     "originalFileName": "typical-trap-loop-2b-130751.mp3",
 *                     "nameOnServer": "FQzDRfeWmrmUMtrW01FKoIDdFxjUt1hk.mp3",
 *                     "mimeType": "audio/mpeg",
 *                     "duration": 7,
 *                     "size": 220682,
 *                     "hslName": "zZC6M8Uh8WOgEWLDO4c6tdhb46XkMNtX"
 *                 },
 *                 "thumbnail": {
 *                     "originalFileName": "UERGOV55N7eEQYahVhAm4UGQ236BGeAO.webp",
 *                     "nameOnServer": "UERGOV55N7eEQYahVhAm4UGQ236BGeAO.webp",
 *                     "mimeType": "image/webp",
 *                     "size": 7860,
 *                     "height": 259,
 *                     "width": 194,
 *                     "aspectRatio": 1.3350515463917525
 *                 },
 *                 "created": 1700058064088,
 *                 "createdReadable": "2023-11-15T14:20:58.776Z",
 *                 "modified": 1700058064088,
 *                 "modifiedReadable": "2023-11-15T14:20:58.776Z",
 *                 "_id": "6554d3d026bfe033a82d9d37",
 *                 "title": "7",
 *                 "artist": "7",
 *                 "duration": "7",
 *                 "audioUrl": "https://v1.flom.dev/api/v2/sounds/FQzDRfeWmrmUMtrW01FKoIDdFxjUt1hk.mp3",
 *                 "thumbnailUrl": "https://v1.flom.dev/api/v2/sounds/UERGOV55N7eEQYahVhAm4UGQ236BGeAO.webp",
 *                 "hslUrl": "https://v1.flom.dev/api/v2/sounds/tiruririrururirieiendfienef.m3u8",
 *                 "__v": 0
 *            }
 *        }
 *     ],
 *     "paginationData": {
 *         "total": 7,
 *         "hasNext": false,
 *         "page": 1,
 *         "pageSize": 20
 *     }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 4000007 Token invalid
 */

router.get(
  "/",
  auth({
    allowAdmin: true,
    role: Const.Role.ADMIN,
    allowUser: true,
  }),
  async (request, response) => {
    try {
      const { artist, title, page: p, size: s } = request.query;

      const query = {};
      if (artist) query.artist = new RegExp(artist, "i");
      if (title) query.title = new RegExp(title, "i");
      const page = !p ? 1 : +p;
      const size = !s ? Const.newPagingRows : +s;

      const sounds = await Sound.find(query).sort({ title: 1 }).lean();
      const total = sounds.length;

      const paginatedSounds = sounds.slice((page - 1) * size, (page - 1) * size + size);
      paginatedSounds.forEach((sound) => {
        sound.audioUrl = Config.webClientUrl + `/api/v2/sounds/${sound.audio.nameOnServer}`;
        sound.hslUrl = Config.webClientUrl + `/api/v2/sounds/${sound.audio.hslName}` + ".m3u8";
        if (sound.thumbnail)
          sound.thumbnailUrl =
            Config.webClientUrl + `/api/v2/sounds/${sound.thumbnail.nameOnServer}`;
      });

      const hasNext = page * size < total;

      Base.successResponse(response, Const.responsecodeSucceed, {
        sounds: paginatedSounds,
        paginationData: { total, hasNext, page, pageSize: size },
      });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "AdminSoundController, GET list",
        error,
      });
    }
  },
);

module.exports = router;
