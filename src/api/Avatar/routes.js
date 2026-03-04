const router = require("express").Router();

router.use("/avatar", require("./Controllers/AvatarController"));

module.exports = router;
