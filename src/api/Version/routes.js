const router = require("express").Router();

router.use("/version", require("./Controllers/VersionController"));

module.exports = router;
