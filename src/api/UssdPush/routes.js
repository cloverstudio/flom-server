const router = require("express").Router();

router.use("/flomussd", require("./Controllers/PushServiceController.js"));
router.use("/registration-ussd", require("./Controllers/RegisterController.js"));

module.exports = router;
