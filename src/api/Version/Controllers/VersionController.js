"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { Configuration } = require("#models");

/**
 * @api {get} /api/v2/version return app version
 * @apiName  return app version
 * @apiGroup WebAPI
 * @apiDescription  return app version
 **/

router.get("", async function (request, response) {
  const regex = new RegExp(/V1/);
  const versionConfigurations = await Configuration.find({
    type: "version-control",
    name: regex,
  }).lean();

  let androidVersion, iosVersion, androidOptionalVersion, iosOptionalVersion;

  for (const item of versionConfigurations) {
    if (item.name.includes("android")) {
      if (item.name.includes("Optional")) {
        androidOptionalVersion = item.value;
      } else {
        androidVersion = item.value;
      }
    }

    if (item.name.includes("ios")) {
      if (item.name.includes("Optional")) {
        iosOptionalVersion = item.value;
      } else {
        iosVersion = item.value;
      }
    }
  }

  Base.successResponse(response, Const.responsecodeSucceed, {
    update: {
      android_update: androidVersion,
      android_update_optional: androidOptionalVersion,
      android_update_text: "",
      iOS_update: iosVersion,
      iOS_update_optional: iosOptionalVersion,
      iOS_update_text: "",
    },
  });
});

module.exports = router;
