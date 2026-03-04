const router = require("express").Router();

router.use("/feedback/add", require("./Controllers/AddFeedbackController"));

module.exports = router;
