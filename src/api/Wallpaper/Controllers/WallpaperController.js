"use strict";

const fsp = require("fs/promises");
const path = require("path");
const router = require("express").Router();
const Base = require("../../Base");
const { Const, Config } = require("#config");
const { auth } = require("#middleware");

/**
 * @api {get} /api/v2/wallpapers/list Get wallpapers
 * @apiVersion 2.0.9
 * @apiName Get wallpapers
 * @apiGroup WebAPI Wallpaper
 * @apiDescription Returns a list of wallpapers.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam (Query string) {String} [type] Type of wallpaper ("light", "dark", "") (default: empty string) ("" - returns both dark and light)
 * @apiParam (Query string) {String} [size] Size of wallpaper ("small", "medium", "large") (default: medium)
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1677149348204,
 *     "data": {
 *         "wallpapers": [
 *             "https://dev-old.flom.app/api/v2/wallpapers/large_light01.jpg",
 *             "https://dev-old.flom.app/api/v2/wallpapers/large_light02.jpg",
 *             "https://dev-old.flom.app/api/v2/wallpapers/large_light03.jpg",
 *             "https://dev-old.flom.app/api/v2/wallpapers/large_light04.jpg",
 *             "https://dev-old.flom.app/api/v2/wallpapers/large_light05.jpg",
 *             "https://dev-old.flom.app/api/v2/wallpapers/large_light06.jpg",
 *             "https://dev-old.flom.app/api/v2/wallpapers/large_light07.jpg",
 *             "https://dev-old.flom.app/api/v2/wallpapers/large_light08.jpg",
 *             "https://dev-old.flom.app/api/v2/wallpapers/large_light09.jpg",
 *             "https://dev-old.flom.app/api/v2/wallpapers/large_light10.jpg",
 *             "https://dev-old.flom.app/api/v2/wallpapers/large_light11.jpg",
 *             "https://dev-old.flom.app/api/v2/wallpapers/large_light12.jpg",
 *             "https://dev-old.flom.app/api/v2/wallpapers/large_light13.jpg"
 *         ]
 *     }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 443801 Invalid parameter (size or type)
 * @apiError (Errors) 4000007 Token not valid
 * @apiError (Errors) 5000001 Unauthorized
 */

router.get(
  "/list",
  auth({ allowUser: true, allowAdmin: true }),
  async function (request, response) {
    try {
      const { type = "", size = "medium" } = request.query;

      if (type !== "light" && type !== "dark" && type !== "") {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidParameter,
          message: `WallpaperController - invalid type`,
          param: "type",
        });
      }
      if (size !== "medium" && size !== "small" && size !== "large") {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidParameter,
          message: `WallpaperController - invalid size`,
          param: "size",
        });
      }

      const files = await fsp.readdir(Config.wallpaperPath);
      const wallpapers = [];

      for (const fileName of files) {
        if (fileName.includes(type) && fileName.includes(size))
          wallpapers.push(`${Config.webClientUrl}/api/v2/wallpapers/${fileName}`);
      }

      Base.successResponse(response, Const.responsecodeSucceed, { wallpapers });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "WallpaperController",
        error,
      });
    }
  },
);

/**
 * @api {get} /api/v2/wallpapers/:fileName Get wallpaper image
 * @apiVersion 2.0.9
 * @apiName Get wallpaper image
 * @apiGroup WebAPI Wallpaper
 * @apiDescription Returns wallpaper image. Send file name including extension.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiSuccessExample Success Response
 * Image.
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 443801 Invalid parameter
 * @apiError (Errors) 443391 File not found
 * @apiError (Errors) 4000007 Token not valid
 * @apiError (Errors) 5000001 Unauthorized
 */

router.get(
  "/:wallpaperName",
  auth({ allowUser: true, allowAdmin: true }),
  async function (request, response) {
    try {
      if (!request.params.wallpaperName) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidParameter,
          message: `WallpaperController, fetch - invalid fileName parameter`,
          param: "fileName",
        });
      }

      const filePath = path.join(Config.wallpaperPath, request.params.wallpaperName);

      try {
        await fsp.access(filePath, fsp.constants.F_OK);

        response.sendFile(filePath);
      } catch (error) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeFileNotFound,
          message: `WallpaperController, fetch - file not found`,
        });
      }
    } catch (error) {
      if (error.code === "ENOENT") {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeFileNotFound,
          message: `WallpaperController, fetch - file not found`,
        });
      }
      return Base.newErrorResponse({
        response,
        message: "WallpaperController - fetch",
        error,
      });
    }
  },
);

module.exports = router;
