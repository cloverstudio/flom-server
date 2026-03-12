"use strict";

const router = require("express").Router();
const { Config } = require("#config");
const { FlomFile } = require("#models");
const fs = require("fs");

/**
 * @api {get} /api/v2/file/fileId download file
 * @apiName File Download
 * @apiGroup WebAPI
 * @apiDescription Returns file binary
 **/

router.get("/:fileId", async function (request, response) {
  try {
    const fileId = request.params.fileId;
    const filePath = Config.uploadPath + "/" + fileId;
    const filePath2 = Config.uploadPath + "/";

    const file = await FlomFile.findById(fileId);

    if (!file) {
      return response.status(404).send("File Not Found");
    }

    if (!fs.existsSync(filePath)) {
      const fileName = file.name;
      const filePathWithName = filePath + fileName.substr(fileName.lastIndexOf("."));

      if (fs.existsSync(filePathWithName)) {
        return response.download(filePathWithName, file.name);
      }

      const filePath2WithName = filePath2 + fileName;

      if (fs.existsSync(filePath2WithName)) {
        return response.download(filePath2WithName, file.name);
      }

      return response.status(404).send("File Not Found");
    }

    return response.download(filePath, file.name);
  } catch (error) {
    return response.status(404).send("File Not Found");
  }
});

module.exports = router;
