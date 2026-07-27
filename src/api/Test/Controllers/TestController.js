"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const, Config, countries } = require("#config");
const { idempotency } = require("#middleware");
const Utils = require("#utils");
const Logics = require("#logics");
const { Test, Product } = require("#models");

router.get("/:id", async (request, response) => {
  try {
    if (Config.environment === "production") {
      throw new Error("Not allowed in production");
    }

    const req = request;

    console.log("method", req.method);
    console.log("baseUrl", req.baseUrl);
    console.log("originalUrl", req.originalUrl);

    Base.successResponse(response, Const.responsecodeSucceed, {});
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "TestController - statics",
      error,
    });
  }
});

router.post("/", idempotency, async (request, response) => {
  try {
    if (Config.environment === "production") {
      throw new Error("Not allowed in production");
    }

    const randomString = Utils.getRandomString(10);

    Base.successResponse(response, Const.responsecodeSucceed, { randomString });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "TestController",
      error,
    });
  }
});

module.exports = router;
