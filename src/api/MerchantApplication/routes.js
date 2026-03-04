const router = require("express").Router();

router.use("/merchant-applications/id-photos", require("./Controllers/IdPhotoController"));
router.use("/merchant-applications", require("./Controllers/MerchantApplicationController"));

module.exports = router;
