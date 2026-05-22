const router = require("express").Router();

router.use("/whatsapp/send", require("./Controllers/SendWhatsAppMessageController"));
router.use("/whatsapp/cb", require("./Controllers/WhatsAppCallbackController"));
router.use("/whatsapp/phone-number", require("./Controllers/GetWhatsAppPhoneNumberController"));
router.use("/whatsapp/followup", require("./Controllers/SendFollowupMessageController"));
router.use("/whatsapp", require("./Controllers/GetWhatsAppChatStatusController"));

module.exports = router;
