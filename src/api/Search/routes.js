const router = require("express").Router();

router.use("/search/all", require("./Controllers/SearchAllController"));
router.use(
  "/search/historyAndMessages",
  require("./Controllers/SearchHistoryAndMessagesController"),
);
router.use("/search/users-and-products", require("./Controllers/SearchUsersAndProductsController"));
router.use("/search/products-marketplace", require("./Controllers/SearchMarketplaceProducts"));

module.exports = router;
