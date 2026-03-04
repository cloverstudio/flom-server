const router = require("express").Router();

router.use("/shipping/addresses", require("./Controllers/ShippingAddressController"));

module.exports = router;
