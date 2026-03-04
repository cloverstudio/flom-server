const router = require("express").Router();

router.use("/talk", require("./Controllers/CreateTalkTicketController"));
router.use("/talk", require("./Controllers/GetTalkTicketController"));
router.use("/talk", require("./Controllers/UpdateTalkTicketController"));

module.exports = router;
