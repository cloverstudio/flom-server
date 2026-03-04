const router = require("express").Router();

router.use("/emoji-set/create", require("./Controllers/CreateEmojiSetController"));
router.use("/emoji-set/add-emoji", require("./Controllers/AddEmojiToSetController"));
router.use("/emoji-set/edit-set", require("./Controllers/EditEmojiSetController"));
router.use("/emoji-set/edit-emoji", require("./Controllers/EditEmojiInSetController"));
router.use("/emoji-set/all-sets", require("./Controllers/GetEmojiSetsController"));
router.use("/emoji-set/emojis", require("./Controllers/GetEmojisController"));
router.use("/emoji-set/search", require("./Controllers/SearchEmojiInSetController"));
router.use("/emoji-set/default-sets", require("./Controllers/GetDefaultEmojiSetsController"));

module.exports = router;
