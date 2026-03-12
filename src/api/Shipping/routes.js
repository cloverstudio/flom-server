const router = require("express").Router();

router.use("/shipping/addresses", require("./Controllers/ShippingAddressController"));
router.use("/shipping/options", require("./Controllers/UpdateUsersShippingOptionsController"));

module.exports = router;
