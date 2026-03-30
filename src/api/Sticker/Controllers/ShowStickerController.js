"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, Config } = require("#config");
const fs = require("fs");

/**
     * @api {get} /api/v2/sticker/:fileID ShowSticker
     * @apiName ShowSticker
     * @apiGroup WebAPI
     * @apiDescription Returns image of the sticker

**/

router.get("/", function (request, response) {
  if (!request.headers("Referer")) {
    Base.errorResponse(
      response,
      Const.httpCodeSucceed,
      Const.responsecodeInvalidParameter,
      "Download Failed",
      false,
    );

    return;
  }

  const filePath = Config.publicPath + "/images/nosticker.png";
  response.type("png");
  response.sendFile(filePath);
});

router.get("/:fileID", function (request, response) {
  if (!request.headers("Referer")) {
    Base.errorResponse(
      response,
      Const.httpCodeSucceed,
      Const.responsecodeInvalidParameter,
      "Download Failed",
      false,
    );

    return;
  }

  const fileID = request.params.fileID;
  let filePath = Config.uploadPath + "/" + fileID;

  fs.existsSync(filePath, function (exists) {
    if (!exists) {
      filePath = Config.publicPath + "/images/nosticker.png";
      response.type("png");
      response.sendFile(filePath);
    } else {
      response.sendFile(filePath);
    }
  });
});

module.exports = router;
