const router = require("express").Router();

router.use("/livestreams/cb", require("./Controllers/AntMediaCallbackController"));
router.use("/livestreams/like", require("./Controllers/LikeLiveStreamController"));
router.use("/livestreams/active", require("./Controllers/GetActiveLiveStreamsController"));
router.use("/livestreams", require("./Controllers/GetCommentsController"));
router.use("/livestreams", require("./Controllers/GetLiveStreamController"));
router.use("/livestreams", require("./Controllers/GetLiveStreamStatsController"));
router.use("/livestreams", require("./Controllers/GetLiveStreamViewsController"));
router.use("/livestreams", require("./Controllers/GetLiveStreamViewersController"));
router.use("/livestreams", require("./Controllers/StartLiveStreamController"));
router.use("/livestreams", require("./Controllers/EndLiveStreamController"));
router.use("/livestreams", require("./Controllers/CreateLiveStreamController"));
router.use("/livestreams", require("./Controllers/UpdateLiveStreamController"));
router.use("/livestreams", require("./Controllers/CohostController"));

module.exports = router;
