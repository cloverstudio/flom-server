const router = require("express").Router();

router.use("/businesses/tags", require("./Controllers/BusinessTagsController"));
router.use("/businesses/assistants", require("./Controllers/AssistantController"));
router.use("/businesses", require("./Controllers/BusinessAvatarController"));
router.use("/businesses", require("./Controllers/BusinessController"));

module.exports = router;
