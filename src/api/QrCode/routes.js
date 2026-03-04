const router = require("express").Router();

router.use("/qrcode/create", require("./Controllers/CreateQrCodeStringController"));
router.use("/qrcode/use", require("./Controllers/UseQrCodeController"));
router.use("/qrcode/ussd/check", require("./Controllers/CheckUSSDCodeController"));
router.use("/qrcode/check", require("./Controllers/CheckQrCodeController"));

module.exports = router;
