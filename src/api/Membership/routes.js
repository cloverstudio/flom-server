const router = require("express").Router();

router.use("/memberships/benefits", require("./Controllers/GetMembershipBenefitsController"));
router.use("/memberships/join", require("./Controllers/JoinMembershipController.js"));
router.use("/memberships/cancel", require("./Controllers/CancelMembershipController"));
router.use("/memberships/update", require("./Controllers/UpdateMembershipController"));
router.use("/memberships", require("./Controllers/MembershipsController"));

module.exports = router;
