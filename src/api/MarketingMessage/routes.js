const router = require("express").Router();

router.use("/marketing-messages/add", require("./Controllers/addMarketingMessageController"));
router.use("/marketing-messages/templates", require("./Controllers/getUsersTemplatesController"));
router.use("/marketing-messages/edit", require("./Controllers/editMarketingMessageController"));
router.use("/marketing-messages/", require("./Controllers/getUsersMarketingMessagesController"));

module.exports = router;
