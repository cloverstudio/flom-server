"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, Config } = require("#config");
const { auth } = require("#middleware");
const fs = require("fs");

/**
 * @api {get} /api/v2/id-applications/photos/:nameOnServer Get ID application photo
 * @apiVersion 2.0.21
 * @apiName Get ID application photo
 * @apiGroup WebAPI ID application
 * @apiDescription API for getting photos of ids in ID applications. Returns png file.
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
      const path = Config.idPhotosPath + "/" + nameOnServer;

      if (fs.existsSync(path)) {
        return response.sendFile(path);
      }

      response.sendStatus(404);
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "GetIdPhotoController - get id photo",
        error,
      });
    }
  },
);

module.exports = router;
