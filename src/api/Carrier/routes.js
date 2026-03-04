const router = require("express").Router();

router.use("/carriers/logo", require("./Controllers/CarrierLogoController"));
router.use("/carriers", require("./Controllers/CarrierController"));

module.exports = router;
