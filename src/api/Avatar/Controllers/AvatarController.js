"use strict";

const fsp = require("fs/promises");
const router = require("express").Router();
const { Config } = require("#config");

/**
 * @api {get} /api/v2/avatar/user/:fileID UserAvatar
 * @apiName User Avatar
 * @apiGroup WebAPI
 * @apiDescription Returns image of user avatar
 **/

router.get("/user/", function (request, response) {
  const filePath = Config.publicPath + "/images/usernoavatar.png";
  response.sendFile(filePath);
});

router.get("/user/:fileID", async function (request, response) {
  const fileID = request.params.fileID;
  let filePath = Config.uploadPath + "/" + fileID;

  try {
    await fsp.access(filePath, fsp.constants.F_OK);
  } catch (error) {
    filePath = Config.publicPath + "/images/usernoavatar.png";
  }

  return response.sendFile(filePath);
});

/**
 * @api {get} /api/v2/avatar/group/:fileID GroupAvatar
 * @apiName Group Avatar
 * @apiGroup WebAPI
 * @apiDescription Returns image of group avatar
 **/

router.get("/group/", function (request, response) {
  const filePath = Config.publicPath + "/images/groupnoavatar.png";
  response.sendFile(filePath);
});

router.get("/group/:fileID", async function (request, response) {
  const fileID = request.params.fileID;
  let filePath = Config.uploadPath + "/" + fileID;

  try {
    await fsp.access(filePath, fsp.constants.F_OK);
  } catch (error) {
    filePath = Config.publicPath + "/images/groupnoavatar.png";
  }

  response.sendFile(filePath);
});

/**
 * @api {get} /api/v2/avatar/room/:fileID RoomAvatar
 * @apiName Room Avatar
 * @apiGroup WebAPI
 * @apiDescription Returns image of room avatar
 **/

router.get("/room/", function (request, response) {
  const filePath = Config.publicPath + "/images/groupnoavatar.png";
  response.sendFile(filePath);
});

router.get("/room/:fileID", async function (request, response) {
  const fileID = request.params.fileID;
  let filePath = Config.uploadPath + "/" + fileID;

  try {
    await fsp.access(filePath, fsp.constants.F_OK);
  } catch (error) {
    filePath = Config.publicPath + "/images/groupnoavatar.png";
  }

  response.sendFile(filePath);
});

module.exports = router;
