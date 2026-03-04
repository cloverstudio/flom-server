const router = require("express").Router();

router.use("/products/next", require("./Controllers/NextProductController"));
router.use("/products/moderation", require("./Controllers/ProductModerationController"));
router.use("/products/quantities", require("./Controllers/ProductQuantitiesController"));
router.use("/products/popular", require("./Controllers/GetPopularProductsController"));
router.use("/products", require("./Controllers/UpdateProductControllerV2"));
router.use("/products", require("./Controllers/AddNewProductControllerV2"));
router.use("/products", require("./Controllers/NewProductListController"));
router.use("/big/products", require("./Controllers/UpdateProductControllerV2"));
router.use("/big/products", require("./Controllers/AddNewProductControllerV2"));
router.use("/products-for-you", require("./Controllers/GetProductsForYouController"));
router.use("/products/for-you", require("./Controllers/GetProductsForYouControllerV2"));
router.use("/products/recommended", require("./Controllers/GetRecommendedProductsController"));
router.use("/product/featured", require("./Controllers/FeaturedProductsController"));
router.use("/products/editor-choice", require("./Controllers/GetEditorChoiceController"));
router.use("/products/expo/audio", require("./Controllers/GetAudioProductsForExpo"));
router.use("/products/expo", require("./Controllers/GetProductInfoForExpo"));
router.use("/products/approved", require("./Controllers/GetApprovedProductsController"));
router.use("/product/add/new", require("./Controllers/AddProductControllerV2"));
router.use("/big/product/add/new", require("./Controllers/AddProductControllerV2"));
router.use("/product/edit/new", require("./Controllers/EditProductControllerV2"));
router.use("/big/product/edit/new", require("./Controllers/EditProductControllerV2"));
router.use("/product/delete", require("./Controllers/DeleteProductController"));
router.use("/product/list", require("./Controllers/ListProductController"));
router.use("/product/list/my", require("./Controllers/ListMerchantProductController"));
router.use("/product/similar", require("./Controllers/GetSimilarProductsController"));
router.use(
  "/product/:productId/numberOfViews",
  require("./Controllers/AddViewToProductController"),
);
router.use("/product/file", require("./Controllers/ProductFilesController"));
router.use("/product/getbyid", require("./Controllers/GetProductById"));
router.use("/product/search", require("./Controllers/GetProductBySearchTerm"));
router.use("/product/paid", require("./Controllers/GetPaidProductsController"));
router.use("/product/merchant", require("./Controllers/SearchMerchantProductsController"));
router.use("/product/like", require("./Controllers/LikeProductController"));
router.use("/product/getInfo", require("./Controllers/GetInfoController"));
router.use("/product/list/my/push", require("./Controllers/ListMerchantProductsForPushController"));

module.exports = router;
