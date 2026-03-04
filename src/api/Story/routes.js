const router = require("express").Router();

router.use("/story", require("./Controllers/StoryController"));

module.exports = router;
