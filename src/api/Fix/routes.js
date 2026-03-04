const router = require("express").Router();

router.use("/fix/send-request", require("./Controllers/SendRequestController"));
router.use("/fix", require("./Controllers/FixController"));

module.exports = router;
