const router = require("express").Router();

router.use("/whatsapp/send", require("./Controllers/WallpaperController"));
router.use("/whatsapp/cb", require("./Controllers/WallpaperController"));

module.exports = router;
