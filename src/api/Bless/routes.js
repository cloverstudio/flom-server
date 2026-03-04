const router = require("express").Router();

router.use("/bless", require("./Controllers/BlessController"));

module.exports = router;
