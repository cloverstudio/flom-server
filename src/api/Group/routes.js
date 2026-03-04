const router = require("express").Router();

router.use("/group/list", require("./Controllers/GroupListController"));
router.use("/group/search", require("./Controllers/GroupSearchController"));
router.use("/group/detail", require("./Controllers/GroupDetailController"));
router.use("/group/users", require("./Controllers/GroupUsersController"));

module.exports = router;
