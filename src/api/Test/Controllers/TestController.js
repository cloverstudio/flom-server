"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const, Config, countries } = require("#config");
const Utils = require("#utils");
const Logics = require("#logics");
const { Test, Product } = require("#models");

router.get("/", async (request, response) => {
  try {
    if (Config.environment === "production") {
      throw new Error("Not allowed in production");
    }

    const a = request.get("abc-def");
    console.log("abc-def", a);
    const b = request.get("Ghi-Jkl");
    console.log("Ghi-Jkl", b);

    Base.successResponse(response, Const.responsecodeSucceed, {});
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "TestController - statics",
      error,
    });
  }
});

module.exports = router;
