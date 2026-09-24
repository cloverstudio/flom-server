"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const gplay = require("google-play-scraper");

router.get("/", async function (request, response) {
  try {
    const { data: getInfo, err } = await Utils.sendRequest({
      method: "GET",
      url: Config.appStoreLink,
    });

    if (err) {
      return Base.errorResponse({
        response,
        code: Const.responsecodeAppNotfound,
        message: `GetInfoController, ios, app not found 1`,
      });
    }

    let icon = getInfo.results[0].artworkUrl100;
    let developer = getInfo.results[0].artistName;
    let rating = getInfo.results[0].averageUserRating;
    let name = getInfo.results[0].trackName;

    if (!icon || !developer) {
      return Base.errorResponse({
        response,
        code: Const.responsecodeAppNotfound,
        message: `GetInfoController, ios, app not found 2`,
      });
    }

    let dataToSend = {
      icon,
      developer,
      rating,
      name,
    };

    Base.successResponse(response, Const.responsecodeSucceed, dataToSend);
  } catch (error) {
    Base.errorResponse({
      response,
      message: `GetInfoController, ios`,
      error,
    });
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

    Base.successResponse(response, Const.responsecodeSucceed, dataToSend);
  } catch (error) {
    Base.errorResponse({
      response,
      message: `GetInfoController, android`,
      error,
    });
  }
});

module.exports = router;
