const router = require("express").Router();

router.use(
  "/marketing-notifications/templates",
  require("./Controllers/MarketingNotificationTemplateController"),
);
router.use("/marketing-notifications", require("./Controllers/MarketingNotificationController"));

module.exports = router;
