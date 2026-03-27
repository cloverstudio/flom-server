"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, Config } = require("#config");
const { auth } = require("#middleware");
const fsp = require("fs/promises");

/**
 * @api {get} /api/v2/merchant-applications/id-photos/:nameOnServer Get id photo
 * @apiVersion 2.0.9
 * @apiName Get id photo
 * @apiGroup WebAPI Merchant application
 * @apiDescription API for getting photos of ids in merchant applications. Returns png file.
 * Access allowed only for admin page. User needs at least admin role.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 443391 Photo file not found
 * @apiError (Errors) 4000007 Token not valid
 * @apiError (Errors) 5000001 Unauthorized
 */

router.get(
  "/:nameOnServer",
  auth({ allowAdmin: true, role: Const.Role.ADMIN }),
  async function (request, response) {
    try {
      const { nameOnServer } = request.params;
      const filePath = Config.idPhotosPath + "/" + nameOnServer;

      try {
        await fsp.access(filePath, fsp.constants.R_OK);
        return response.sendFile(filePath);
      } catch (error) {
        if (error.code !== "ENOENT") {
          throw error;
        }
      }

      try {
        await fsp.access(filePath + ".jpg", fsp.constants.R_OK);
        return response.sendFile(filePath + ".jpg");
      } catch (error) {
        if (error.code !== "ENOENT") {
          throw error;
        }
        return response.sendStatus(404);
      }
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "IdPhotoController - get id photo",
        error,
      });
    }
  },
);

module.exports = router;
