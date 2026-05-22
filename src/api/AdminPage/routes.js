const router = require("express").Router();

router.use("/admin-page/sounds", require("./Controllers/AdminSoundController.js"));
router.use("/admin-page/transactions", require("./Controllers/AdminTransfersController.js"));
router.use("/admin-page/users", require("./Controllers/AdminUsersController.js"));
router.use("/admin-page/sms-prices", require("./Controllers/CalculateSMSPricesController.js"));
router.use("/admin-page/categories", require("./Controllers/CategoryController.js"));
router.use("/admin-page/check-audio", require("./Controllers/CheckAudioDuplicatesController.js"));
router.use("/admin-page/credit-limits", require("./Controllers/CreditTransferLimitsController.js"));
router.use(
  "/admin-page/customer-activation",
  require("./Controllers/CustomerActivationController.js"),
);
router.use("/admin-page/email", require("./Controllers/EmailVerificationController.js"));
router.use("/admin-page/fees", require("./Controllers/FeesController.js"));
router.use("/admin-page/invite-messages", require("./Controllers/InviteMessageController.js"));
router.use("/admin-page/login", require("./Controllers/LoginController.js"));
router.use(
  "/admin-page/manage-livestreams",
  require("./Controllers/ManageLiveStreamsController.js"),
);
router.use("/admin-page/moderators-jobs", require("./Controllers/ModeratorsJobController.js"));
router.use("/admin-page/password-reset", require("./Controllers/PasswordResetController.js"));
router.use("/admin-page/payment-logs", require("./Controllers/PaymentLogController.js"));
router.use("/admin-page/payout/limits", require("./Controllers/PayoutLimitsController.js"));
router.use("/admin-page/payout", require("./Controllers/PayoutController.js"));
router.use(
  "/admin-page/product-moderation-logs",
  require("./Controllers/ProductModerationLogController.js"),
);
router.use("/admin-page/register", require("./Controllers/RegistrationController.js"));
router.use("/admin-page/remove-comment", require("./Controllers/RemoveCommentController.js"));
router.use("/admin-page/send-sms", require("./Controllers/SendSMSController.js"));
router.use("/admin-page/sms-data", require("./Controllers/SmsDataController.js"));
router.use("/admin-page/spray-bless", require("./Controllers/SprayBlessController.js"));
router.use("/admin-page/tax", require("./Controllers/TaxRateController.js"));
router.use(
  "/admin-page/third-party-products",
  require("./Controllers/ThirdPartyProductsController.js"),
);
router.use(
  "/admin-page/update-agent",
  require("./Controllers/UpdateFlomAgentsBalanceController.js"),
);
router.use("/admin-page/user", require("./Controllers/UpdateUserDetailsController.js"));

module.exports = router;
