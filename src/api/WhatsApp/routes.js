const router = require("express").Router();

router.use("/whatsapp/send", require("./Controllers/SendWhatsAppMessageController"));
router.use("/whatsapp/cb", require("./Controllers/WhatsAppCallbackController"));
router.use("/whatsapp/phonenumber", require("./Controllers/GetWhatsAppPhoneNumber"));

module.exports = router;
