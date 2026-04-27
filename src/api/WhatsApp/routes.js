const router = require("express").Router();

router.use("/whatsapp/send", require("./Controllers/SendWhatsAppMessageController"));
router.use("/whatsapp/cb", require("./Controllers/WhatsAppCallbackController"));
router.use("/whatsapp/phone-number", require("./Controllers/GetWhatsAppPhoneNumber"));

module.exports = router;
