const router = require("express").Router();

router.use("/flomoji", require("./Controllers/GetFlomojiListController"));
router.use("/flomoji", require("./Controllers/SearchFlomojiController"));
router.use("/flomoji", require("./Controllers/DeleteFlomojiController"));
router.use("/flomoji", require("./Controllers/CreateFlomojiController"));
router.use("/flomoji", require("./Controllers/EditFlomojiController"));

module.exports = router;
