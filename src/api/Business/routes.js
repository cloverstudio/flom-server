const router = require("express").Router();

router.use("/businesses/outlets", require("./Controllers/OutletController"));
router.use("/businesses/terminals", require("./Controllers/TerminalController"));
router.use("/businesses/tags", require("./Controllers/BusinessTagsController"));
router.use("/businesses/invites", require("./Controllers/BusinessInviteController"));
router.use("/businesses", require("./Controllers/AssistantController"));
router.use("/businesses", require("./Controllers/BusinessAvatarController"));
router.use("/businesses", require("./Controllers/ServiceController"));
router.use("/businesses", require("./Controllers/BusinessController"));

module.exports = router;
