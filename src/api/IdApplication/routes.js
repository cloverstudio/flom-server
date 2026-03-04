const router = require("express").Router();

router.use("/id-applications/photos", require("./Controllers/GetIdPhotoController"));
router.use("/id-applications", require("./Controllers/GetIdApplicationController"));
router.use("/id-applications", require("./Controllers/CreateIdApplicationController"));
router.use("/id-applications", require("./Controllers/UpdateIdApplicationController"));

module.exports = router;
