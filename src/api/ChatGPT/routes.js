const router = require("express").Router();

router.use("/chat-gpt/add-blocked", require("./Controllers/AddNewBlockedCountryController"));
router.use("/chat-gpt/blocked", require("./Controllers/GetBlockedCountriesController"));
router.use("/chat-gpt/remove-blocked", require("./Controllers/RemoveBlockedCountryController"));

module.exports = router;
