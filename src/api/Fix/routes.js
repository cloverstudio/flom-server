const { Config, Const } = require("#config");
const router = require("express").Router();
const Base = require("../Base");

function isAuthenticated(req, res, next) {
  if (req.headers["secret-token"] !== Config.secretToken) {
    return Base.successResponse(res, Const.responsecodeSucceed, {
      message: "Invalid secret token",
    });
  }
  next();
}

router.use("/fix/send-request", isAuthenticated, require("./Controllers/SendRequestController"));
router.use("/fix", isAuthenticated, require("./Controllers/FixController"));

module.exports = router;
