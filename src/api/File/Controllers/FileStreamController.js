"use strict";

const router = require("express").Router();
const { logger } = require("#infra");
const { Config } = require("#config");
const fs = require("fs");

/**
 * @api {get} /api/v2/file/stream/fileId stream file
 * @apiName File Stream
 * @apiGroup WebAPI
 * @apiDescription Returns file binary
 **/

router.get("/:fileId", async function (request, response) {
  try {
    const fileId = request.params.fileId;
    let filePath = Config.uploadPath + "/" + fileId;

    if (!fs.existsSync(filePath)) {
      return response.status(500).send("File Stream error");
    }

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(response);
  } catch (error) {
    logger.error("FileStreamController", error);
    return response.status(500).send("File Stream error");
  }
});

module.exports = router;
