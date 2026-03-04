const router = require("express").Router();

router.use("/wallpapers", require("./Controllers/WallpaperController"));

module.exports = router;
