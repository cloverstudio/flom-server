const router = require("express").Router();

router.use("/review/product", require("./Controllers/GetProductReviewsController"));
router.use("/reviews", require("./Controllers/NewReviewController"));

module.exports = router;
