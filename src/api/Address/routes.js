const router = require("express").Router();

router.use("/address/autocomplete", require("./Controllers/AddressController"));

module.exports = router;
