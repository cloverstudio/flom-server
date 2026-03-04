const router = require("express").Router();

router.use("/credits/rate", require("./Controllers/CreditConversionRateController"));
router.use("/credits", require("./Controllers/CreditPackageController"));

module.exports = router;
