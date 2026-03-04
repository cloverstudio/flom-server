const router = require("express").Router();

router.use("/credit-cards", require("./Controllers/CreditCardController"));

module.exports = router;
