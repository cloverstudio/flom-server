const router = require("express").Router();

router.use("/sounds", require("./Controllers/SoundController"));

module.exports = router;
