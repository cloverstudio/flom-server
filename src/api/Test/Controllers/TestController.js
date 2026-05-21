"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const, Config, countries } = require("#config");
const Utils = require("#utils");
const Logics = require("#logics");
const { Test } = require("#models");

router.get("/statics", async (request, response) => {
  try {
    if (Config.environment === "production") {
      throw new Error("Not allowed in production");
    }

    Test.testFn();

    Base.successResponse(response, Const.responsecodeSucceed);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "TestController - statics",
      error,
    });
  }
});

module.exports = router;
