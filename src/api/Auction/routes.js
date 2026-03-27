const router = require("express").Router();

router.use("/auctions", require("./Controllers/RemoveAuctionBanController"));
router.use("/auctions", require("./Controllers/AcceptAuctionOfferController"));
router.use("/auctions", require("./Controllers/RejectAuctionOfferController"));
router.use("/auctions", require("./Controllers/CreateAuctionController"));
router.use("/auctions", require("./Controllers/UpdateAuctionController"));
router.use("/auctions", require("./Controllers/DeleteAuctionController"));
router.use("/auctions", require("./Controllers/GetAuctionController"));

module.exports = router;
