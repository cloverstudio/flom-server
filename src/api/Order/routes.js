const router = require("express").Router();

router.use("/orders", require("./Controllers/GetOrderController"));
router.use("/orders", require("./Controllers/ShipOrderController"));
router.use("/orders", require("./Controllers/MarkOrderDeliveredController"));
router.use("/orders", require("./Controllers/CancelOrderController"));
router.use("/orders", require("./Controllers/CloseOrderController"));

module.exports = router;
