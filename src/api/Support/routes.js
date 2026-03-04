const router = require("express").Router();

router.use("/support/user-search", require("./Controllers/SupportUserSearchController"));
router.use("/support/file", require("./Controllers/SupportWithFileController"));
router.use("/support/send-bonus", require("./Controllers/SupportBonusController"));
router.use("/support/newsletter", require("./Controllers/TestNewsletterEmailTemplateController"));
router.use("/support", require("./Controllers/SupportController"));

module.exports = router;
