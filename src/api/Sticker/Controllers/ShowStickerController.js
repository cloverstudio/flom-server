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
    return Base.newErrorResponse({
      response,
      message: "ShowStickerController, no sticker, no referer header present",
      error: new Error("No referer header present"),
    });
  }

  const filePath = Config.publicPath + "/images/nosticker.png";
  response.type("png");
  response.sendFile(filePath);
});

router.get("/:fileID", function (request, response) {
  if (!request.headers("Referer")) {
    return Base.newErrorResponse({
      response,
      message: "ShowStickerController, fileId, no referer header present",
      error: new Error("No referer header present"),
    });
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
