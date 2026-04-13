const router = require("express").Router();

router.use("/whatsapp/send", require("./Controllers/SendWhatsAppMessageController"));
router.use("/whatsapp/cb", require("./Controllers/WhatsAppCallbackController"));

module.exports = router;
