const router = require("express").Router();

router.use("/dashboard/product/search", require("./Controllers/SearchProductsUsersController"));
router.use("/dashboard/product", require("./Controllers/GetProductDetailsController"));
router.use(
  "/dashboard/community/user-payments",
  require("./Controllers/GetUserCommunityPlanHistoryDetails"),
);
router.use("/dashboard/community/users", require("./Controllers/GetCommunityPlanUsersController"));
router.use("/dashboard/community", require("./Controllers/GetCommunityDetailsController"));
router.use("/dashboard/content/search", require("./Controllers/SearchContentProductsController"));
router.use("/dashboard/content", require("./Controllers/GetContentDetailsController"));
router.use(
  "/dashboard/marketplace/search",
  require("./Controllers/SearchMarketplaceProductsController"),
);
router.use("/dashboard/marketplace", require("./Controllers/GetMarketplaceDetailsController"));
router.use("/dashboard/other/search", require("./Controllers/SearchOtherProductsController"));
router.use("/dashboard/other", require("./Controllers/GetOtherDetailsController"));
router.use("/dashboard/graph/credits", require("./Controllers/GetGraphCreditsDetailsController"));
router.use("/dashboard/graph", require("./Controllers/GetGraphDetailsController"));
router.use("/dashboard", require("./Controllers/GetTotalEarnedController"));

module.exports = router;
