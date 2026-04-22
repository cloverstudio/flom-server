const router = require("express").Router();

router.use("/user/signin", require("./Controllers/SigninController"));
router.use("/user/signout", require("./Controllers/SignoutController"));
router.use("/user/signup", require("./Controllers/SignupController"));
router.use("/user/search", require("./Controllers/UserSearchController"));
router.use("/user/update", require("./Controllers/UpdateProfileController"));
router.use("/user/getAllUserContacts", require("./Controllers/GetAllUserContactsController"));
router.use("/user/history", require("./Controllers/HistoryListController"));
router.use("/user/history/markall", require("./Controllers/MarkAllAsReadController"));
router.use("/user/history/markchat", require("./Controllers/MarkAsReadByChatController"));
router.use("/user/history/setunreadtozero", require("./Controllers/SetUreadCountToZeroController"));
router.use("/user/detail/token", require("./Controllers/GetUserDetailsByTokenController"));
router.use("/user/token-from-cookie", require("./Controllers/GetTokenFromCookieController"));
router.use("/user/detail", require("./Controllers/UserDetailController"));
router.use("/user/savepushtoken", require("./Controllers/SavePushTokenController"));
router.use(
  "/user/savewebpushsubscription",
  require("./Controllers/SaveWebPushSubscriptionControllerV2"),
);
router.use("/user/savevoippushtoken", require("./Controllers/SaveVoipPushTokenController"));
router.use("/user/block", require("./Controllers/BlockUserController"));
router.use("/user/mute", require("./Controllers/MuteController"));
router.use("/user/mutelist", require("./Controllers/MuteListController"));
router.use("/user/blocklist", require("./Controllers/BlockListController"));
router.use("/user/sync", require("./Controllers/UserSyncContactsController"));
router.use("/user/getContacts", require("./Controllers/UserGetContactsController"));
router.use("/user/deleteContact", require("./Controllers/UserDeleteContactController"));
router.use("/user/history/delete", require("./Controllers/DeleteHistoryController"));
router.use("/user/pin", require("./Controllers/PinController"));
router.use("/user/sendphonenumber", require("./Controllers/SendPhoneNumberController"));
router.use("/user/presendphonenumber", require("./Controllers/SmsVerificationController"));
router.use("/user/merchantenrollment", require("./Controllers/MerchantEnrollmentController"));
router.use(
  "/user/phoneNumber/validation",
  require("./Controllers/PhoneNumberValidationController"),
);
router.use("/user/follow", require("./Controllers/FollowUserController"));
router.use("/user/sendinvitation", require("./Controllers/SendInvitationSMSController"));
router.use("/user/push/all", require("./Controllers/SendMessageToAllUsersController"));
router.use("/user/getUserByPhone", require("./Controllers/GetUserByPhoneController"));
router.use("/user/online-status", require("./Controllers/UsersOnlineStatusController"));
router.use("/user/delete-account", require("./Controllers/DeleteUserController"));
router.use("/user/revert-account", require("./Controllers/RevertUserController"));
router.use("/user/merchant-code", require("./Controllers/getUserByMerchantCodeController"));
router.use(
  "/user/username-or-merchant-code",
  require("./Controllers/getUserByUsernameOrMerchantCodeController"),
);
router.use("/user/receive-payments", require("./Controllers/ReceivePaymentsController"));
router.use("/user/products", require("./Controllers/UsersProductsController"));
router.use("/user/products/recent", require("./Controllers/RecentlyViewedProductsController"));
router.use("/user/payment-methods", require("./Controllers/UserSavedPaymentMethods"));
router.use("/user/get-by-lncode", require("./Controllers/GetUserByLightningUrlEncodedController"));
router.use("/user/tribes", require("./Controllers/IsUserTribeMemberController"));
router.use("/user/reject-cohost", require("./Controllers/RejectCohostInvitationController"));
router.use("/user/livestream", require("./Controllers/GetUsersActiveLiveStreamController"));
router.use(
  "/user/community-members",
  require("./Controllers/GetAllMembersOfUsersCommunitiesController"),
);
router.use("/user/tribe-members", require("./Controllers/GetAllMembersOfUsersTribesController"));
router.use("/user/content-engagement", require("./Controllers/UserContentEngagementController"));
router.use("/user/rating-attempt", require("./Controllers/RecordRatingAttemptController"));
router.use("/users/sellers", require("./Controllers/GetAllSellersController"));
router.use("/users/featured", require("./Controllers/FeaturedUserProductsController"));
router.use("/users/blocked", require("./Controllers/BlockedUserProductsController"));
router.use("/users/memberships", require("./Controllers/GetUserMemberships"));
router.use("/users/community", require("./Controllers/UsersCommunityContent"));
router.use("/users/notifications", require("./Controllers/UserNotificationsController"));
router.use("/users/merchant-code", require("./Controllers/newGetUserByMerchantCodeController"));
router.use("/users/transfers", require("./Controllers/UserTransfersController"));
router.use("/users/best-creators", require("./Controllers/GetBestCreatorsController"));
router.use("/users/international", require("./Controllers/SetInternationalUserFlagController"));
router.use("/users/active", require("./Controllers/GetActiveUsersController"));
router.use("/users/search", require("./Controllers/SearchUsersController"));
router.use("/users", require("./Controllers/NewUserController"));
router.use("/user", require("./Controllers/UserEmailController"));
router.use("/user/bank-account", require("./Controllers/UsersBankAccountsController"));
router.use("/user/bank-accounts", require("./Controllers/UpdateUsersBankAccountController"));
router.use("/user/social-media", require("./Controllers/UserSocialMediaController"));
router.use("/user/notification-options", require("./Controllers/NotificationOptionsController"));
router.use("/user/notifications/wa", require("./Controllers/WhatsAppNotificationsController"));

module.exports = router;
