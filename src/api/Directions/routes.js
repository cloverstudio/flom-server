const router = require("express").Router();

router.use("/directions", require("./Controllers/DirectionsController"));

module.exports = router;
