const router = require("express").Router();

router.use("/stickers", require("./Controllers/StickersController"));
router.use("/sticker", require("./Controllers/ShowStickerController"));

module.exports = router;
