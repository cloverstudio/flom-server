const router = require("express").Router();

router.use("/login/presend", require("./Controllers/PresendController"));
router.use("/login/did/cb", require("./Controllers/DidWWCallbackController"));
router.use("/login/did/get-number", require("./Controllers/GetFreeDidWWNumberController"));
router.use("/login/did/check-number", require("./Controllers/CheckNumberDidWWController"));

module.exports = router;
