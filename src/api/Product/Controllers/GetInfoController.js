"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const gplay = require("google-play-scraper");

router.get("/", async function (request, response) {
  try {
    const getInfo = await Utils.sendRequest({ method: "GET", url: Config.appStoreLink });

    let icon = getInfo.results[0].artworkUrl100;
    let developer = getInfo.results[0].artistName;
    let rating = getInfo.results[0].averageUserRating;
    let name = getInfo.results[0].trackName;

    if (!icon || !developer) {
      return Base.successResponse(response, Const.responsecodeAppNotfound);
    }

    let dataToSend = {
      icon,
      developer,
      rating,
      name,
    };

    return Base.successResponse(response, Const.responsecodeSucceed, dataToSend);
  } catch (error) {
    logger.error("GetInfoController - app store", error);
  }
});

router.get("/android", async function (request, response) {
  try {
    const getInfo = await gplay.app({ appId: "com.qrios.flom.messenger" });

    let icon = getInfo.icon;
    let developer = getInfo.developer;
    let rating = getInfo.scoreText;
    let name = getInfo.title;

    let dataToSend = {
      icon,
      developer,
      rating,
      name,
    };

    return Base.successResponse(response, Const.responsecodeSucceed, dataToSend);
  } catch (error) {
    logger.error("GetInfoController - gplay", error);
  }
});

module.exports = router;
