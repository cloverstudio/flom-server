const router = require("express").Router();

router.use("/ussd", require("./Controllers/UssdController"));

module.exports = router;
