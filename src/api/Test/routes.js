const router = require("express").Router();
const { Const, Config, countries } = require("#config");

function guardTest(request, response, next) {
  if (Config.environment === "production") {
    return response.status(403).json({
      code: Const.responsecodeForbidden,
      message: "Not allowed in production",
    });
  }

  next();
}

// router.use(guardTest);

router.use("/test", guardTest, require("./Controllers/TestController"));

module.exports = router;
