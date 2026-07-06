const router = require("express").Router();

router.use("/businesses", require("./Controllers/BusinessAvatarController"));
router.use("/businesses", require("./Controllers/BusinessController"));

module.exports = router;
