const router = require("express").Router();

router.use("/tags/popular", require("./Controllers/GetTagsController"));

module.exports = router;
