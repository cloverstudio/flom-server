const router = require("express").Router();

router.use("/message/search", require("./Controllers/SearchMessageController"));
router.use("/message/favorite/add", require("./Controllers/AddToFavoriteController"));
router.use("/message/favorite/remove", require("./Controllers/RemoveFromFavoriteController"));
router.use("/message/favorite/list", require("./Controllers/FavoriteListController"));
router.use("/message/favorite/list", require("./Controllers/FavoriteListByChatController"));
router.use("/message/forward", require("./Controllers/ForwardMessageController"));
router.use("/message/send", require("./Controllers/SendMessageController"));
router.use("/message/seenby", require("./Controllers/SeenByController"));
router.use("/message/deliver", require("./Controllers/DeliverMessageController"));
router.use("/message/list", require("./Controllers/MessageListController"));
router.use("/message/undeliver/list", require("./Controllers/UndeliverMessageListController"));
router.use(
  "/message/update-request/",
  require("./Controllers/UpdateRequestTransferMessageController"),
);
router.use("/messages", require("./Controllers/GetMessagesController"));
router.use("/messages/forward", require("./Controllers/ForwardMessagesController"));

module.exports = router;
