const router = require("express").Router();

router.use("/payment-methods/logo", require("./Controllers/PaymentMethodLogoController"));
router.use("/payment-methods/get-logo", require("./Controllers/GetPaymentMethodLogoController"));
router.use("/payment-methods", require("./Controllers/PaymentMethodController"));

module.exports = router;
