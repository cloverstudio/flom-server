const router = require("express").Router();

router.use("/contact", require("./Controllers/CreateContactTicketController.js"));
router.use("/contact", require("./Controllers/GetContactTicketController.js"));
router.use("/contact", require("./Controllers/UpdateContactTicketController.js"));

module.exports = router;
