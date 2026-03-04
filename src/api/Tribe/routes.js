const router = require("express").Router();

router.use("/tribes", require("./Controllers/GetUserByUsernameController"));
router.use("/tribes", require("./Controllers/RequestToJoinTribeController"));
router.use("/tribes", require("./Controllers/ReviewInvitationController"));
router.use("/tribes", require("./Controllers/ReviewPendingMembersController"));
router.use("/tribes", require("./Controllers/GetTribeController"));
router.use("/tribes", require("./Controllers/EditTribeController"));
router.use("/tribes", require("./Controllers/DeleteTribeController"));
router.use("/tribes", require("./Controllers/LeaveTribeController"));
router.use("/tribes", require("./Controllers/CreateTribeController"));
router.use("/tribes", require("./Controllers/TribeListController"));

module.exports = router;
