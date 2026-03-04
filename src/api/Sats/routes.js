const router = require("express").Router();

router.use("/sats/add-blocked", require("./Controllers/AddNewBlockedCountryController"));
router.use("/sats/blocked", require("./Controllers/GetBlockedCountriesController"));
router.use("/sats/remove-blocked", require("./Controllers/RemoveBlockedCountryController"));

module.exports = router;
