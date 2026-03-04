const router = require("express").Router();

router.use("/room/list/mine", require("./Controllers/RoomListMineController"));
router.use("/room/list", require("./Controllers/RoomListController"));
router.use("/room/new", require("./Controllers/CreateRoomController"));
router.use("/room/update", require("./Controllers/UpdateRoomController"));
router.use("/room/leave", require("./Controllers/LeaveRoomController"));
router.use("/room/detail", require("./Controllers/RoomDetailController"));
router.use("/room/users", require("./Controllers/RoomUsersController"));
router.use("/room/users/add", require("./Controllers/AddUsersToRoomController"));
router.use("/room/users/remove", require("./Controllers/RemoveUsersFromRoomController"));
router.use("/room/search", require("./Controllers/SearchRoomController"));
router.use("/room/admin", require("./Controllers/RoomAdminController"));

module.exports = router;
