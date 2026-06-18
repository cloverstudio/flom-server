const router = require("express").Router();

router.use("/inbox/cockpit", require("./Controllers/CockpitController"));

module.exports = router;
