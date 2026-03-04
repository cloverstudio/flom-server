const router = require("express").Router();

router.use("/orders", require("./Controllers/GetOrderController"));
router.use("/orders", require("./Controllers/UpdateOrderController"));

module.exports = router;
