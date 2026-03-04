const router = require("express").Router();

router.use("/app/startup", require("./Controllers/StartupController"));

module.exports = router;
