const router = require("express").Router();

router.use("/notifications/related", require("./Controllers/GetRelatedNotificationController"));
router.use("/notifications", require("./Controllers/GetNotificationController"));

module.exports = router;
