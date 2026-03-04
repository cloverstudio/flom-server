const router = require("express").Router();

router.use("/category/list", require("./Controllers/ListCategoryController"));
router.use("/mainCategory/list", require("./Controllers/ListMainCategoryController"));
router.use("/subCategory/list", require("./Controllers/ListSubCategoryController"));
router.use("/subCategory/listTypesAndMakes", require("./Controllers/ListTypesAndMakesController"));
router.use("/subCategory/listVehicleModels", require("./Controllers/ListVehicleModelController"));
router.use("/subCategory/listTypeFields", require("./Controllers/ListTypeFieldsController"));

module.exports = router;
