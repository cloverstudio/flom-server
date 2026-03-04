"use strict";

const router = require("express").Router();
const { Config } = require("#config");
const fs = require("fs");
const jdenticon = require("jdenticon");

/**
 * @api {get} /api/v2/product/file Default Product File
 * @apiVersion 2.0.8
 * @apiName Default Product File
 * @apiGroup WebAPI Products
 * @apiDescription Returns product file
 */

router.get("/", function (request, response) {
  const filePath = Config.publicPath + "/images/usernoavatar.png";
  response.sendFile(filePath);
});

/**
 * @api {get} /api/v2/product/file/:fileID Product File
 * @apiVersion 2.0.8
 * @apiName Product File
 * @apiGroup WebAPI Products
 * @apiDescription Returns product file
 */

router.get("/:fileID", function (request, response) {
  const fileID = request.params.fileID;
  let filePath = Config.uploadPath + "/" + fileID;

  if (!fs.existsSync(filePath)) {
    filePath = Config.uploadPath + "/defaultProduct.png";
    if (!fs.existsSync(filePath)) {
      const png = jdenticon.toPng(fileID, 256);
      fs.writeFileSync(filePath, png);
    }
  }
  response.sendFile(filePath);
});

module.exports = router;
