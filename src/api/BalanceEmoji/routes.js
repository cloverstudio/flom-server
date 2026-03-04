const router = require("express").Router();

router.use("/balance-emoji", require("./Controllers/CreateBalanceEmojiController"));
router.use("/balance-emoji", require("./Controllers/DeleteBalanceEmojiController"));
router.use("/balance-emoji", require("./Controllers/EditBalanceEmojiController"));
router.use("/balance-emoji", require("./Controllers/GetBalanceEmojiListController"));

module.exports = router;
