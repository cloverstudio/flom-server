const router = require("express").Router();

router.use("/inbox/cockpit", require("./Controllers/CockpitController"));
router.use("/inbox", require("./Controllers/InboxController"));

module.exports = router;
