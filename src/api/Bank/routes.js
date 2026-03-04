const router = require("express").Router();

router.use("/bank", require("./Controllers/BankController"));

module.exports = router;
