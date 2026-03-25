const Config = require("./config");

const Constants = {};

Constants.stringPurchase_ = "Purchase_";
Constants.stringNew_purchase = "New_purchase";
Constants.stringrequest_noun = "request";
Constants.stringPayout_ = "Payout_";

Constants.stringpending = "pending";
Constants.stringsent = "sent";
Constants.stringreceived = "received";
Constants.stringcomplete = "complete";
Constants.stringcompleted = "completed";
Constants.stringcanceled = "canceled";
Constants.stringfailed = "failed";
Constants.stringrejected = "rejected";
Constants.stringsuccessful = "successful";

Constants.stringGroup_chat = "Group_chat";

Constants.stringGuest = "Guest";
Constants.stringGuest_user = "Guest_user";

Constants.stringYou_joined_ = "You_joined ";
Constants.stringYou_canceled_ = "You_canceled ";
Constants.stringYou_updated_to_ = "You_updated to ";

Constants.secondInMs = 1000;
Constants.minuteInMs = 1000 * 60;
Constants.hourInMs = 1000 * 60 * 60;
Constants.dayInMs = 1000 * 60 * 60 * 24;

Constants.httpCodeSucceed = 200;
Constants.httpCodeForbidden = 403;
Constants.httpCodeFileNotFound = 404;
Constants.httpCodeBadParameter = 422;
Constants.httpCodeServerError = 500;

Constants.thumbSize = 256;
Constants.searchLimit = 10;

Constants.REUsername = /^[0-9A-Za-z._+-]{6,}$/;
Constants.REPassword = /^[0-9A-Za-z._+-]{6,}$/;
Constants.RENumbers = /^[0-9]*$/;

Constants.tokenLength = 16;
Constants.adminPageTokenLength = 20;
Constants.twoFactorAuthTokenLength = 18;
Constants.resetPasswordTokenLength = 30;
Constants.pagingRows = 10; //temp changed from 30 to 10
Constants.newPagingRows = 10;
Constants.pagingRowsHistoryAndMessages = 10;
Constants.pagingBlessPackets = 8;
Constants.pagingMultiBlessPackets = 32;

Constants.tokenValidInterval = 60 * 60 * 24 * 1000 * 30 * 12 * 5;
Constants.adminPageTokenValidInterval = 1000 * 60 * 60 * 24;
Constants.adminTempTokenValidInterval = 1000 * 60 * 5;
Constants.adminSmsCodeValidInterval = 1000 * 60 * 2;
Constants.adminPagePasswordResetTokenValidInterval = 1000 * 60 * 60 * 3;
//Constants.tokenValidInterval = 1000 * 60 * 2; // ms

Constants.chatTypePrivate = 1;
Constants.chatTypeGroup = 2;
Constants.chatTypeRoom = 3;
Constants.chatTypeTribeGroupChat = 4;
Constants.chatTypeBroadcastAdmin = 5;

Constants.maxBatchSizeFindResult = 5000;

Constants.redisKeyOnlineStatus = "onlinestatus_";
Constants.redisKeySocketId = "socketid_";
Constants.redisKeyAuctionsSocketId = "auctions_socketid_";
Constants.redisKeyUserId = "userid_";
Constants.redisKeyAuctionsUserId = "auctions_userid_";
Constants.redisKeyCurrentRoomId = "currentroom_";
Constants.redisKeySocketIdPool = "socketidpool_";
Constants.redisCallQueue = "callqueue_";
Constants.adminForcelogoutList = "adminforcelogoutlist";
Constants.redisKeyAccessToken = "accessToken:";

Constants.groupType = {
  group: 1,
  department: 2,
};

Constants.pushTokenThreadSize = 50;
Constants.apnCategoryMessage = "message";

Constants.hookTypeInbound = 1;
Constants.hookTypeOutgoing = 2;

Constants.userPermission = {
  webClient: 1,
  organizationAdmin: 2,
  subAdmin: 3,
  flomAgent: 4,
};

Constants.stickerType = {
  owner: 1,
  admin: 2,
};

Constants.botUserIdPrefix = "b0200000000000000000";

Constants.heartBeatInterval = 10; // sec

Constants.hostidFile = "hostid"; // sec

Constants.callFaildOffline = 1;
Constants.callFaildUserBusy = 2;
Constants.callFaildUserRejected = 2;

Constants.gigabyteToByteMultiplier = 1000000000;

Constants.messageTypeText = 1;
Constants.messageTypeFile = 2; // document
Constants.messageTypeLocation = 3;
Constants.messageTypeContact = 4;
Constants.messageTypeSticker = 5;
Constants.messageTypeImage = 101;
Constants.messageTypeVideo = 102;
Constants.messageTypeAudio = 103;
Constants.messageTypeProduct = 104;
Constants.messageTypeShop = 105;
Constants.messageTypeAddUserToRoom = 106;
Constants.messageTypeReceipt = 9;
Constants.messageTypeCall = 7;
Constants.messageTypeOffer = 8;
Constants.messageTypeRequestPay = 10;
Constants.messageTypeTransfer = 15;
Constants.messageTypeGif = 114;
Constants.messageTypeNewLiveStream = 16;
Constants.messageTypeLiveStreamCohostInvitation = 17;
Constants.messageTypeAuctionOffer = 18;

Constants.pushTypeNewMessage = 1;
Constants.pushTypeCall = 2;
Constants.pushTypeCallClose = 3;
Constants.pushTypeCallAnswerMine = 300;
Constants.pushTypeBonusSent = 401;
Constants.pushTypeContactRegistered = 402;
Constants.pushTypeUnreadCount = 403;
Constants.pushTypeNewAdminBroadcastMessage = 404;
Constants.pushTypeProduct = 500;
Constants.pushTypeShop = 501;
Constants.pushTypeRequestLogin = 600;
Constants.pushTypeUSSDLogin = 700;
Constants.pushTypeMarketingNotification = 750;
Constants.pushTypeMerchantApplication = 760;
Constants.pushTypeIdApplication = 761;
Constants.pushTypeTribeNotification = 770;
Constants.pushTypeProductModeration = 780;
Constants.pushTypeNewProduct = 781;
Constants.pushTypeMembership = 785;
Constants.pushTypePayoutComplete = 825;
Constants.pushTypePayoutFailed = 826;
Constants.pushTypeOfferInitiated = 840;
Constants.pushTypeOfferAccepted = 841;
Constants.pushTypeOfferRejected = 842;
Constants.pushTypeOfferRefused = 843;
Constants.pushTypeMessageReactionSent = 850;
Constants.pushTypeNewLiveStream = 901;
Constants.pushTypeLiveStreamCohostInvitation = 902;
Constants.pushTypeAuctionWin = 910;

Constants.muteActionMute = "mute";
Constants.muteActionUnmute = "unmute";

Constants.blockActionBlock = "block";
Constants.blockActionUnblock = "unblock";

Constants.userStatus = {
  disabled: 0,
  enabled: 1,
};

Constants.onlineStatus = {
  online: -1,
  offline: -2,
};

Constants.onlineCheckerInterval = 180 * 1000;
Constants.offlineTimeLimit = 180 * 1000;

Constants.pagingLimit = 50;

Constants.MessageLoadDirection = {
  appendNoLimit: "allto",
  append: "new",
  appendAnd: "newAnd",
  prepend: "old",
};

Constants.typingOff = 0;
Constants.typingOn = 1;

Constants.APIKeyLength = 32;

// For validation of api v3
Constants.inputInfoMinLength = 6;
Constants.nameMaxLength = 64;
Constants.descriptionMaxLength = 512;

Constants.callStatusConnected = 1;
Constants.callStatusUserBusy = 2;
Constants.callStatusCallerCancel = 3;
Constants.callStatusCalleeRejected = 4;
Constants.callStatusCallMissed = 6;
Constants.callStatusUnknown = 5;
Constants.callStatusCallUnreachable = 7;
Constants.callStatusCallTimeout = 8;

Constants.callStatusCalling = 1000;
Constants.callStatusRinging = 1001;
Constants.callStatusConnecting = 1002;
Constants.callStatusAllConnected = 1003;
Constants.callStatusReconnecting = 1004;
Constants.callStatusEnded = 1005;

Constants.callTypeAudio = 1;
Constants.callTypeVideo = 2;

Constants.errorMessage = {
  offsetIsMinus: "offset parameter can not be minus.",
  nameIsEmpty: "name is empty. Please input name.",
  userIdIsEmpty: "userid is empty. Please input userid.",
  passwordIsEmpty: "password is empty. Please input password.",
  messageIsEmpty: "message is empty.",
  roomNotExist: "room is not existed.",
  userNotExistInOrganization: "user does not exist in organization.",
  userNotExistInRoom: "user does not exist in room.",
  messageNotExist: "message data does not exist.",
  useridTooShort: "userid is too short. Please input more than 6 characters.",
  passwordTooShort: "password is too short. Please input more than 6 characters.",
  nameTooLarge: "name is too large. Please input shorter than 64 characters.",
  useridTooLarge: "userid is too large. Please input shorter than 64 characters.",
  sortNameTooLarge: "sortName is too large. Please input shorter than 64 characters.",
  passwordTooLarge: "password is too large. Please input shorter than 64 characters.",
  descriptionTooLarge: "description is too large. Please input shorter than 512 characters.",
  groupDuplicated: "You already have the same name group. Please change the name.",
  userDuplicated: "You already have the same name user. Please change the name.",
  groupidIsWrong: "groupId is wrong. Please input the correct id.",
  useridIsWrong: "userid is wrong. Please input the correct id.",
  roomidIsWrong: "roomId is wrong. Please input the correct id.",
  messageidIsWrong: "messageId is wrong. Please input the correct id.",
  fileIsWrong: "file only can be set by jpeg, gif and png.",
  includeUsersNotExist: "Wrong users.",
  includeUsersNotExistInOrganiation: "Some userid in users doesn't exist.",
  includeGroupsNotExist: "Wrong groups.",
  includeGroupsNotExistInOrganiation: "Some groupId in groups doesn't exist.",
  responsecodeMaxRoomNumber: "You've already had the max number of rooms.",
  ownerCannotLeaveRoom: "The room owner can't leave room.",
  includeGroupsNotExistInOrganiation: "Some groupId in groups doesn't exist in your organization.",
  wrongUserIds: "users parameter is wrong.",
  cannotUpdateRoom: "you can't update this room because you are not owner",
  cannotDeleteRoom: "you can't delete this room because you are not owner.",
  cannotUpdateMessage: "you can't update this message because you are not sender",
  cannotDeleteMessage: "you can't delete this message because you are not sender.",
  wrongUserPermission: "User permission must be 1 (web client) or 3 (sub-admin)",
};

Constants.webhookEventMessage = "message";
Constants.webhookEventStartConversation = "start_conversation";

Constants.merchantDoesntExist = 4000110;
Constants.organizationId = "5caf3119ec0abb18999bd753";
Constants.groupId = "5caf311bec0abb18999bd755";

Constants.transactionTimeoutAlive = 5 * 60 * 1000; // min x sec x milli
Constants.transactionTimeoutDead = 24 * 60 * 60 * 1000; // min x sec x milli

Constants.userTypeMerchant = 1;
Constants.userTypeCustomer = 2;

Constants.transactionTypeProduct = 1;
Constants.transactionTypeMerchant = 2;
Constants.transactionTypeAirTime = 3;
Constants.transactionTypeData = 4;
Constants.transactionTypeBless = 5;

Constants.singleReceiver = "SingleReceiver";
Constants.multiReceivers = "MultiReceivers";

Constants.defaultCategoryId = "5bd98d220bb237660b061159";

Constants.qriosMerchantCode = "50201314";
Constants.minimumAirtimeAmount = 50;

Constants.defaultOrnigazationId = "flomorg";

Constants.nigerianCallingCode = "+234";

Constants.fakePhoneNumbers = [
  "+2348020000001",
  "+2348020000002",
  "+2348020000003",
  "+2348020000004",
  "+2348020000005",
  "+2348020000006",
  "+2348020000007",
  "+2348020000008",
  "+2348020000009",
  "+2348020000010",
  "+2348020000011",
  "+2348020000012",
  "+2348020000013",
  "+2348020000014",
  "+2348020000015",
  "+2348020000016",
  "+2348020000017",
  "+2348020000018",
  "+2348020000019",
  "+2348020000020",
  "+2348020000021",
  "+2348020000022",
  "+2348020000023",
  "+2348020000024",
  "+2348020000025",
  "+2348020000026",
  "+2348020000027",
  "+2348020000028",
  "+2348020000029",
  "+2348020000030",
  "+2348020000031",
  "+2348020000032",
  "+2348020000033",
  "+2348020000034",
  "+2348020000035",
  "+2348020000036",
  "+2348020000037",
  "+2348020000038",
  "+2348020000039",
  "+2348020000040",
  "+2348020000041",
  "+2348020000042",
  "+2348020000043",
  "+2348020000044",
  "+2348020000045",
  "+2348020000046",
  "+2348020000047",
  "+2348020000048",
  "+2348020000049",
  "+2348020000050",
  "+2348020000051",
  "+2348020000052",
  "+2348020000053",
  "+2348020000054",
  "+2348020000055",
  "+2348020000056",
  "+2348020000057",
  "+2348020000058",
  "+2348020000059",
  "+2348020000060",
];

Constants.fakeTestingPhoneNumbers = ["+12025550191"];

Constants.fakeBankAcc = {
  merchantCode: "40200168",
  name: "SampleAcc",
  accountNumber: "1503567574679",
  code: "",
  selected: true,
};

Constants.fakeBankAccounts = [
  {
    name: "UBA",
    accountNumber: "204****282",
    code: "000004",
  },
  {
    name: "ZENITH",
    accountNumber: "208****096",
    code: "000015",
  },
  {
    name: "DIAMOND",
    accountNumber: "007****759",
    code: "000005",
  },
  {
    name: "GTB",
    accountNumber: "042****046",
    code: "000013",
  },
];

Constants.tempMerchantCode = "89440477"; // QRIOS account

Constants.userSelectQuery = {
  _id: 1,
  name: 1,
  phoneNumber: 1,
  avatar: 1,
  bankAccounts: 1,
  location: 1,
  locationVisibility: 1,
  aboutBusiness: 1,
  businessCategory: 1,
  workingHours: 1,
  created: 1,
  isAppUser: 1,
  userName: 1,
};

Constants.millisecondsPerDay = 86400000;

// sent to contact list when user registers
Constants.defaultInviteContactSMSMessage =
  "Hey! user.name joined Flom App to get my creativity discovered and earn $ income. Claim your own profile using  https://flom.co. Also on Play & AppStore";
Constants.defaultInviteContactUSSDMessage =
  "user.name has joined FLOM. Built for Africans. Call. Chat. Make Money. Download: www.flop.app Get FREE Recharge when you give feedback.";

// sent when user asks for invite over ussd
Constants.defaultInviteSMSOverUssd =
  "user.name uses Flom and wants you to try it. So download at https://flom.app its OUR AFRICAN version of Free CALLS and Group CHAT";

Constants.redisCallLog = "call-log_";
Constants.defaultLocation = [0, 0];
Constants.defaultLocalPrice = {
  localMin: -1,
  localMax: -1,
  localAmount: -1,
  amount: -1,
  minAmount: -1,
  maxAmount: -1,
};

Constants.welcomeMessageText = `Hi!

Welcome to Flom Messenger!

How can we help? If you need assistance with an issue, transaction or just need guidance on how to navigate one of our apps, please let us know. Someone will jump in to support you.

Flom Team`;

Constants.FatAiMaxTokens = 200;
Constants.FatAiObjectId =
  Config.environment !== "production" ? "641c307c218754fb21129b95" : "641c307c218754fb21129b95";
Constants.FatAiContinueMessage = "Want me to continue? Say yes or 𰈦";
Constants.FatAiBlockedCountryMessage =
  "Sorry! I cannot respond due to country restrictions for you. Contact Flom team if you think this should change.";

Constants.thumbUpFatAiContinueResponse = "𰈦";
Constants.FatAiSystemMessage = "You are FatAi, an AI assistant.";

Constants.FlomTeamPhoneNumber =
  Config.environment !== "production" ? "+2348020000100" : "+19729031602";
Constants.FlomTeamObjectId =
  Config.environment !== "production" ? "5e08f8029d384b04a30b23aa" : "600c62808a3b6641b0036f3f";
Constants.FlomTeamSystemMessage =
  "You are a helpfull assistant from Flom Team. You goal is to help drafting a response. Please provide a professional yet firm response. At the end of message append 'Best regards!'. Start response with 'Hello, '";

Constants.FlomTeamTicketRedirectedMessage =
  "The ticket for this issue has been created. You will soon be contacted by our support team on email to resolve the issue. Thank you for reaching out to us.";

Constants.FlomTeamAssistantId = "asst_jZe20vUIZC5HgQHboY5ERWfa";
Constants.milisInYear = 31556926000;

Constants.welcomeMessageChatGpt = `How far?! 👋 
🔍 new opportunities?
Make 💰? 
Learn 🧠?  
Here to help unleash your creativity. 
Can I assist you today?`;

Constants.dataGifts = {
  airtel: {
    sku: "5006",
    operator: "airtel",
    amount: 1000,
    description: "1.5GB for 30 days",
  },
  glo: {
    sku: "7005",
    operator: "glo",
    amount: 1000,
    description: "2.3GB 30days",
  },
  mtn: {
    sku: "6005",
    operator: "mtn",
    amount: 1000,
    description: "1GB + 500MB 30days",
  },
  "9mobile": {
    sku: "4005",
    operator: "etisalat",
    amount: 1000,
    description: "9Mobile monthly 1.5GB",
  },
};

Constants.mtnRecharge = {
  internal: {
    sku: "mtn-internal-recharge",
    operator: "mtn",
    amount: null,
    bankCodes: ["070", "011", "044", "039", "057", "214", "033", "032", "082", "076"],
    description: "Airtime Recharge",
  },
  external: {
    sku: "mtn-external-recharge",
    operator: "mtn",
    amount: null,
    bankCodes: ["011", "044", "039", "057", "033", "032", "082", "076"],
    description: "Airtime Recharge",
  },
};

Constants.UssdSessionTypeUnknown = 0;
Constants.UssdSessionTypeSendMessage = 1;
Constants.UssdSessionTypeGetMessages = 2;
Constants.UssdSessionTypeReadMessage = 3;

Constants.moderationStatusPending = 1;
Constants.moderationStatusRejected = 2;
Constants.moderationStatusApproved = 3;
Constants.moderationStatusApprovalNeeded = 4;
Constants.moderationStatusDraft = 5;

Constants.merchantApplicationStatusPending = 1;
Constants.merchantApplicationStatusRejected = 2;
Constants.merchantApplicationStatusApprovedWithoutPayout = 3;
Constants.merchantApplicationStatusPendingPaypalSent = 4;
Constants.merchantApplicationStatusPendingPaypalReceived = 5;
Constants.merchantApplicationStatusApprovedWithPayout = 6;
Constants.merchantApplicationStatusPendingPaypalEmailAdded = 7;

Constants.idApplicationStatusPending = 1;
Constants.idApplicationStatusRejected = 2;
Constants.idApplicationStatusApproved = 3;

Constants.identityStatusDefault = 1;
Constants.identityStatusVerificationNeeded = 2;
Constants.identityStatusVerified = 3;
Constants.identityStatusInvalid = 4;

Constants.Role = {
  INITIAL: 50,
  EMAIL_VERIFIED: 100,
  SUPPORT_TICKET_REVIEWER: 110,
  STICKER_MANAGER: 120,
  REVIEWER: 300,
  APPROVER: 500,
  CONTENT_MANAGER: 700,
  MODERATOR: 800,
  ADMIN: 900,
  SUPER_ADMIN: 1000,
};
Constants.adminPageRoles = [50, 100, 110, 120, 300, 500, 700, 800, 900, 1000];

Constants.productTypes = [1, 2, 3, 4, 5];
Constants.productTypeVideo = 1;
Constants.productTypeVideoStory = 2;
Constants.productTypePodcast = 3;
Constants.productTypeTextStory = 4;
Constants.productTypeProduct = 5;

Constants.productVisibilityPublic = "public";
Constants.productVisibilityTribes = "tribes";
Constants.productVisibilityCommunity = "community";
Constants.defaultProductVisibility = "public";
Constants.productVisibilities = ["public", "tribes", "community"];

Constants.marketingNotificationsContentTypes = [1, 2, 3, 4, 5, 6, 7];
Constants.marketingNotificationsContentTypeProfile = 6;
Constants.marketingNotificationsContentTypeMarketplace = 7;

Constants.notificationTypeGeneral = 0;
Constants.notificationTypeTransfer = 1;
Constants.notificationTypeRequestTransfer = 2;
Constants.notificationTypeMarketing = 3;
Constants.notificationTypeMarketplaceTransfer = 4;
Constants.notificationTypeTribe = 5;
Constants.notificationTypeTribeInvite = 6;
Constants.notificationTypeTribeRequest = 7;
Constants.notificationTypeProductApproved = 8;
Constants.notificationTypeProductRejected = 9;
Constants.notificationTypeProductAdded = 10;
Constants.notificationTypeMemberships = 11;
Constants.notificationTypeBonus = 12;
Constants.notificationTypePayout = 13;
Constants.notificationTypeMerchantApplication = 15;
Constants.notificationTypeIdApplication = 16;
Constants.notificationTypeNewLiveStream = 17;
Constants.notificationTypeLiveStreamCohostInvitation = 18;
Constants.notificationTypeAuctionOffer = 19;

Constants.notificationTypesFromDb = [5, 6, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 19];

Constants.tribeActionUserRemoved = 1;
Constants.tribeActionUserLeft = 2;
Constants.tribeActionTribeDeleted = 3;

Constants.membershipBenefits = {
  1: { type: 1, title: "Group chat", enabled: false },
  2: { type: 2, title: "Private messaging", enabled: false },
  3: { type: 3, title: "Video call", enabled: false },
  4: { type: 4, title: "Audio call", enabled: false },
  5: { type: 5, title: "Content description", enabled: false },
  6: { type: 6, title: "Go live", enabled: false },
};

Constants.recurringPaymentTypeMonthlyUpfront = 1;
Constants.recurringPaymentTypes = [1];

Constants.socialMediaLinkTemplate = {
  1: {
    profileWebUrl: "https://open.spotify.com/user/{username}",
  },
  3: {
    profileWebUrl: "https://medium.com/@{username}",
  },
  5: {
    profileWebUrl: "https://www.youtube.com/user/{username}",
    profileIOSUrl: "youtube://www.youtube.com/user/{username}",
  },

  6: {
    profileWebUrl: "https://www.tiktok.com/@{username}",
  },
  7: {
    profileWebUrl: "https://instagram.com/{username}",
    profileIOSUrl: "instagram://user?username={username}",
    profileAndroidUrl: "https://instagram.com/_u/{username}",
  },
  8: {
    profileWebUrl: "https://www.snapchat.com/add/{username}",
  },
};

Constants.defaultProfileBanner = {
  file: {
    originalName: "1 874.png",
    nameOnServer: "defaultBanner",
    size: 70369,
    mimeType: "image/png",
    aspectRatio: 3.13044,
  },
  fileType: 0,
  thumb: {
    originalName: "1 874.png",
    nameOnServer: "defaultBannerThumb",
    mimeType: "image/jpeg",
    size: 174000,
  },
};

Constants.reviewTypeNormal = 1;
Constants.reviewTypeBless = 2;
Constants.reviewTypeSpray = 3;

Constants.newFlomModels = [
  "AdminPageUser",
  "BinLookup",
  "Configuration",
  "NumberDefaultCarrier",
  "BannedNumber",
];

Constants.publicFolderCacheTime = 30 * 60 * 1000;

Constants.fileTypeImage = 0;
Constants.fileTypeVideo = 1;
Constants.fileTypeAudio = 2;

Constants.topUpAmountStep = 5;
Constants.ppnTopUpMax = 100;
Constants.dataAmountStep = 5;
Constants.minimumPpnProductAmountInDollars = 1;

Constants.nigerianCarrierLogos = {
  airtel: `${Config.webClientUrl}/api/v2/carriers/logo/airtel`,
  smile: `${Config.webClientUrl}/api/v2/carriers/logo/smile`,
  mtn: `${Config.webClientUrl}/api/v2/carriers/logo/mtn`,
  glo: `${Config.webClientUrl}/api/v2/carriers/logo/glo`,
  ntel: `${Config.webClientUrl}/api/v2/carriers/logo/ntel`,
  "9mobile": `${Config.webClientUrl}/api/v2/carriers/logo/9mobile`,
};

Constants.nigerianTopUpPackets = [
  { sku: 1, amount: 1, maxAmount: 200 },
  { sku: 2, amount: 5, maxAmount: 200 },
  { sku: 3, amount: 10, maxAmount: 200 },
  { sku: 4, amount: 15, maxAmount: 200 },
  { sku: 5, amount: 20, maxAmount: 200 },
  { sku: 6, amount: 25, maxAmount: 200 },
  { sku: 7, amount: 30, maxAmount: 200 },
  { sku: 8, amount: 35, maxAmount: 200 },
  { sku: 9, amount: 40, maxAmount: 200 },
  { sku: 10, amount: 45, maxAmount: 200 },
  { sku: 11, amount: 50, maxAmount: 200 },
  { sku: 12, amount: 55, maxAmount: 200 },
  { sku: 13, amount: 60, maxAmount: 200 },
  { sku: 14, amount: 65, maxAmount: 200 },
  { sku: 15, amount: 70, maxAmount: 200 },
  { sku: 16, amount: 75, maxAmount: 200 },
  { sku: 17, amount: 80, maxAmount: 200 },
  { sku: 18, amount: 85, maxAmount: 200 },
  { sku: 19, amount: 90, maxAmount: 200 },
  { sku: 20, amount: 95, maxAmount: 200 },
  { sku: 21, amount: 100, maxAmount: 200 },
];

Constants.carrierList = {
  NG: [
    {
      name: "airtel",
      logoLink: `${Config.webClientUrl}/api/v2/carriers/logo/airtel`,
      topUpPackets: Constants.nigerianTopUpPackets,
    },
    {
      name: "smile",
      logoLink: `${Config.webClientUrl}/api/v2/carriers/logo/smile`,
      topUpPackets: Constants.nigerianTopUpPackets,
    },
    {
      name: "mtn",
      logoLink: `${Config.webClientUrl}/api/v2/carriers/logo/mtn`,
      topUpPackets: Constants.nigerianTopUpPackets,
    },
    {
      name: "glo",
      logoLink: `${Config.webClientUrl}/api/v2/carriers/logo/glo`,
      topUpPackets: Constants.nigerianTopUpPackets,
    },
    {
      name: "ntel",
      logoLink: `${Config.webClientUrl}/api/v2/carriers/logo/ntel`,
      topUpPackets: Constants.nigerianTopUpPackets,
    },
    {
      name: "9mobile",
      logoLink: `${Config.webClientUrl}/api/v2/carriers/logo/9mobile`,
      topUpPackets: Constants.nigerianTopUpPackets,
    },
  ],
};

Constants.configurationTypeSpecialConversionRates = "special-conversion-rates";

Constants.transferSenderTypeUser = "user";
Constants.transferSenderTypeGuest = "guest";

Constants.transferTypeTopUp = 1;
Constants.transferTypeData = 2;
Constants.transferTypeSuperBless = 3;
Constants.transferTypeMarketplace = 4;
Constants.transferTypeMembership = 5;
Constants.transferTypeCash = 6;
Constants.transferTypeCreditPackage = 7;
Constants.transferTypeCredits = 8;
Constants.transferTypeSprayBless = 9;
Constants.transferTypeSats = 10;
Constants.transferTypeSatsPurchase = 11;
Constants.transferTypeMediaContent = 12;
Constants.transferTypeDirectCash = 13;
Constants.transferTypeGiftCard = 14;
Constants.transferTypeBillPayment = 15;
Constants.transferTypeOrder = 16;
Constants.transferTypeBonus = 97;
Constants.transferTypeBonusData = 98;
Constants.transferTypePayout = 99;

Constants.blessEmojiTitles = [
  "Fit",
  "Fig",
  "Fed",
  "Fax",
  "Fay",
  "Fix",
  "Fen",
  "Fab",
  "Bit",
  "Big",
  "Bed",
  "Bax",
  "Bay",
  "Bix",
  "Ben",
  "Bab",
  "Sit",
  "Sig",
  "Sed",
  "Sax",
  "Say",
  "Six",
  "Sen",
  "Sab",
  "Lit",
  "Lig",
  "Led",
  "Lax",
  "Lay",
  "Lix",
  "Len",
  "Lab",
  "Fit",
  "Fig",
  "Fed",
  "Fax",
  "Fay",
  "Fix",
  "Fen",
  "Fab",
];

Constants.transferTypes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 99];

Constants.noticeTransferTypes = [1, 2, 3, 6, 8, 10, 13, 14, 15, 16];

Constants.transferPrepayment = 1;
Constants.transferWaitingForFulfillment = 2;
Constants.transferComplete = 3;
Constants.transferFulfillmentFailed = 4;
Constants.transferPaymentFailed = 5;
Constants.transferVoided = 6;
Constants.transferFulfillmentCompleted = 7;
Constants.transferRefundRequested = 8;
Constants.transferRefundComplete = 9;
Constants.transferRefundFailed = 10;

Constants.transferStatuses = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

Constants.requestTransferPending = 101;
Constants.requestTransferRejected = 102;

Constants.recurringPaymentStatusInitial = 1;
Constants.recurringPaymentStatusActive = 2;
Constants.recurringPaymentStatusCanceled = 3;
Constants.recurringPaymentStatusCancelFailed = 4;
Constants.recurringPaymentStatusFailed = 5;

Constants.defaultPaymentMethodType = 1;
Constants.paymentMethodTypeCreditCard = 1;
Constants.paymentMethodTypePayPal = 2;
Constants.paymentMethodTypeBankAccount = 3;
Constants.paymentMethodTypeCreditBalance = 4;
Constants.paymentMethodTypeSatsBalance = 5;
Constants.paymentMethodTypeInternal = 99;

Constants.paymentMethods = [1, 2, 3, 4, 5];

Constants.alternativeAddressCountries = [
  "AU",
  "CA",
  "FR",
  "HK",
  "IN",
  "IE",
  "IL",
  "MY",
  "NZ",
  "PK",
  "PH",
  "SA",
  "SG",
  "LK",
  "TH",
  "UK",
  "US",
  "VN",
];

Constants.categoryGroupAll = 1;
Constants.categoryGroupCreators = 2;
Constants.categoryGroupMerchants = 3;
Constants.categoryGroupVideo = 11;
Constants.categoryGroupVideoStory = 12;
Constants.categoryGroupPodcast = 13;
Constants.categoryGroupTextStory = 14;
Constants.categoryGroupProduct = 15;

Constants.categoryGroups = [1, 2, 3, 11, 12, 13, 14, 15];

Constants.tribeMaxSize = 20;
Constants.tribeUserStatus = {
  accepted: "accepted",
  requested: "requested",
  invited: "invited",
  declined: "not in tribe",
};
Constants.tribeMemberRoleMember = 1;
Constants.tribeMemberRoleElder = 2;
Constants.tribeMemberRoleCoOwner = 3;
Constants.tribeMemberRoleOwner = 4;
Constants.tribeMemberRoles = [1, 2, 3, 4];

Constants.tribeMaxCoOwners = 4;

Constants.logTypeSupport = "support";
Constants.logTypeLogin = "login";

Constants.blockedNumberTypeCarrier = 1;

Constants.phoneNumberUntested = 1;
Constants.phoneNumberInvalid = 2;
Constants.phoneNumberValid = 3;

Constants.payoutMethodTypePaypal = 1;
Constants.payoutMethodTypeBankAccount = 2;

Constants.payoutFrequencyMonthly = 1;
Constants.payoutFrequencyBiWeekly = 2;
Constants.payoutFrequencyWeekly = 3;
Constants.payoutFrequencyDaily = 4;
Constants.payoutFrequencyNever = 5;

Constants.payoutPending = 1;
Constants.payoutFailed = 2;
Constants.payoutComplete = 3;
Constants.payoutAdminActionRequired = 4;

Constants.payoutStatuses = [1, 2, 3, 4];

Constants.cardLogoPaths = {
  amex: "amex_logo.png",
  "american express": "amex_logo.png",
  diners: "diners_logo.png",
  discover: "discover_logo.png",
  jsb: "jcb_logo.png",
  mastercard: "mastercard_logo.png",
  visa: "visa_logo.png",
};

Constants.defaultCardLogo = "default_credit_card_logo.webp";

Constants.talkTicketStatusSubmitted = 1;
Constants.talkTicketStatusInProgress = 2;
Constants.talkTicketStatusCompleted = 3;
Constants.talkTicketStatusSupervisorRequested = 4;

Constants.contactTicketStatusSubmitted = 1;
Constants.contactTicketStatusInProgress = 2;
Constants.contactTicketStatusCompleted = 3;
Constants.contactTicketStatusSupervisorRequested = 4;

Constants.floodPeriod = 1000 * 60; // 1 minute
Constants.floodLimit = 3; // 3 logins in 1 minute
Constants.floodEmailPeriod = 1000 * 60 * 60 * 12; // send out an email every 12 hour period

Constants.banksByCode = {
  "011": "First Bank",
  "023": "Citi Bank",
  "030": "Heritage Bank",
  "032": "Union Bank",
  "033": "eNaira",
  "035": "Wema Bank",
  "044": "Access Bank",
  "050": "Ecobank",
  "057": "Zenith Bank",
  "058": "GT Bank",
  "063": "Access Bank (Diamond)",
  "068": "Standard Chartered",
  "070": "Fidelity Bank",
  "076": "Polaris Bank",
  "082": "Keystone Bank",
  "084": "Enterprise Bank",
  100: "SUNTRUST",
  101: "Providus Bank",
  214: "FCMB",
  215: "Unity",
  221: "Stanbic IBTC Bank",
  232: "Sterling Bank",
  233: "Jaiz Bank",
  301: "Jaiz Bank",
  302: "Eartholeum",
  303: "CHAMS Mobile",
  304: "Stanbic Mobile Money",
  305: "Paycom",
  306: "E-Tranzact",
  307: "Ecobank Mobile",
  308: "HEDONMARK Mobile",
  309: "FBN MOBILE",
  311: "Parkway",
  313: "MIMO (Mkudi)",
  314: "Fet",
  315: "GTBank Mobile Money",
  317: "Cellulant",
  319: "Teasy Mobile",
  320: "VTNETWORK",
  323: "Access Mobile",
  324: "FORTIS Mobile",
  401: "Aso Savings and Loans",
  501: "FSDH Merchant",
  580: "Regent Microfinance",
  602: "Accion Microfinance",
  605: "Nirsal Microfinance",
  625: "Titan Bank",
  706: "Gateway Mortgage Bank",
};

Constants.satsToBtcRate = 100_000_000;

Constants.userLoggedInAtLeastOnce = 1;
Constants.userNeverLoggedIn = 2;
Constants.userOldUser = 3;
Constants.userShadowUser = 4;

Constants.allowedNGBankCodes = ["011"];

Constants.smsDataPriceFactor = 10_000;

Constants.contentPurchaseTypeSingle = "single";
Constants.contentPurchaseTypeUnlimited = "unlimited";
Constants.contentPurchaseTypeExclusive = "exclusive";

Constants.audioComparisonSegmentAccuracyLimit = 0.75;
Constants.audioComparisonHitRatioLimit = 0.5;

Constants.liveStreamTypes = ["live", "event", "market"];
Constants.liveStreamTypeLive = "live";
Constants.liveStreamTypeEvent = "event";
Constants.liveStreamTypeMarket = "market";

Constants.maxLiveStreamCohosts = 4;

Constants.ignoredHeaders = [
  "connection",
  "x-forwarded-proto",
  "host",
  "accept-encoding",
  //"user-agent",
  "accept",
  "accept-language",
  "os-version",
  "ios-version",
  "content-length",
  "content-type",
  //"sec-ch-ua",
  //"sec-ch-ua-mobile",
  //"sec-ch-ua-platform",
  "sec-fetch-site",
  "sec-fetch-mode",
  "sec-fetch-dest",
  "if-none-match",
  "origin",
  "referer",
  "x-real-ip",
  "access-control-request-method",
  "access-control-request-headers",
];

Constants.androidNewPushVersion = 140019;

Constants.appPort = Config.environment === "production" ? "8080" : "8084";

Constants.unreadMessagesPushMessage = "📬 You have [Number] unread messages waiting—catch up now!";

Constants.dataForSync = "dataForSync";
Constants.dataForFeedback = "dataForFeedback";
Constants.dataForFirstPaymentOrApprovedProduct = "dataForFirstPaymentOrApprovedProduct";
Constants.payoutForApprovedMerchantApplication = "payoutForApprovedMerchantApplication";
Constants.payoutForApprovedExpo = "payoutForApprovedExpo";
Constants.payoutForApprovedVideo = "payoutForApprovedVideo";
Constants.payoutForApprovedAudio = "payoutForApprovedAudio";
Constants.payoutForApprovedText = "payoutForApprovedText";
Constants.bonusTypeSync = "sync";
Constants.bonusTypeVisitingStreak = "visitingStreak";
Constants.bonusTypeContent = "content";
Constants.bonusTypeFeedback = "feedback";
Constants.bonusTypeComment = "comment";
Constants.bonusTypeLike = "like";
Constants.bonusTypeRating = "rating";
Constants.bonusTypeHighEngagementContent = "highEngagementContent";
Constants.bonusTypeLiveStreamComment = "liveStreamComment";
Constants.bonusTypePlaying5Minutes = "playing5Minutes";
Constants.bonusTypePlayingFullContent = "playingFullContent";
Constants.bonusTypeBugReport = "bugReport";
Constants.creditsForLinkedProductInExpo = "creditsForLinkedProductInExpo";

Constants.highEngagementContentThreshold = 100; // number of likes

Constants.productTypeToBonusTypeMap = {
  1: "payoutForApprovedVideo",
  2: "payoutForApprovedExpo",
  3: "payoutForApprovedAudio",
  4: "payoutForApprovedText",
  5: "dataForFirstPaymentOrApprovedProduct",
};

Constants.bonusPayoutMessage =
  "🎉 Welcome to Flom! Your sign-up bonus is in your PAYOUT_METHOD account. Start your digital earning journey with us!";

Constants.defaultBonusDataPackages = {
  mtn: 6031,
  glo: 7004,
  airtel: 5025,
  "9mobile": 4016,
};

Constants.visitingStreakBonusMap = {
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
};

Constants.bonusAmountMapCredits = {
  sync: 10,
  content: 50,
  feedback: 50,
  comment: 2,
  like: 1,
  rating: 2,
  highEngagementContent: 100,
  liveStreamComment: 5,
  playing5Minutes: 10,
  playingFullContent: 25,
  bugReport: 100,
};

Constants.bonusAmountMapSats = {
  sync: 250,
  content: 200,
  feedback: 50,
  comment: 10,
  like: 1,
  rating: 100,
  highEngagementContent: 200,
  liveStreamComment: 200,
  playing5Minutes: 5,
  playingFullContent: 20,
  bugReport: 200,
};

Constants.bonusDailyLimitMapCredits = {
  comment: 30,
  like: 50,
  rating: 40,
  playing5Minutes: 50,
};

Constants.bonusDailyLimitMapSats = {
  comment: 100,
  like: 100,
  rating: 200,
  playing5Minutes: 250,
};

Constants.bonusReasonMap = {
  sync: "syncing contacts",
  content: "new content: CONTENT_NAME",
  feedback: "feedback",
  comment: "comment on: CONTENT_NAME",
  like: "like on: CONTENT_NAME",
  rating: "rating on: CONTENT_NAME",
  highEngagementContent: "high engagement content:CONTENT_NAME",
  liveStreamComment: "comment on: CONTENT_NAME",
  playing5Minutes: "playing 5 minutes of content: CONTENT_NAME",
  playingFullContent: "playing full content: CONTENT_NAME",
  bugReport: "bug report",
  creditsForLinkedProductInExpo: "linked product in expo: CONTENT_NAME",
};

Constants.bonusDataMessage =
  "🎉 Welcome to Flom App! Bonus unlocked for joining! This weekend, earn big by giving feedback, uploading content, or sharing stickers. Invite others and boost your earnings! 🚀";

Constants.bonusDataPackageLimits = {
  dataForSync: 1000,
  dataForFeedback: 100,
  dataForFirstPaymentOrApprovedProduct: 200,
};

Constants.bonusMessage =
  "🎉 Earn Flom BONUS_PAYMENT_METHOD for tasks! Cash out $ directly to your bank! 🎉";

Constants.defaultContactRegisteredPushMessage =
  "[User] has joined FlomApp. Tap here to start chatting.";

Constants.paymentCallback = {
  clientId: "DEV",
  operationId: "",
  operation: "merchantpayment",
  result: "success",
  cause: null,
  status: {
    result: "success",
    cause: null,
  },
  merchantpayment: {
    reference: "DEV",
    transactionId: "DEV",
  },
};
Constants.airtimeCallback = {
  clientId: "DEV",
  operationId: "",
  operation: "acquire",
  result: "success",
  cause: null,
  status: {
    result: "success",
    cause: null,
  },
  acquire: {
    operator: "DEV",
    reference: "DEV",
    transactionId: "DEV",
    error: "SUCCESS",
  },
};
Constants.payoutCallback = {
  clientId: "DEV",
  operationId: "",
  operation: "payout",
  status: {
    result: "success",
  },
  payout: {
    externalPayoutId: "DEV",
  },
};

Constants.offerMessageStatusInitiated = 1;
Constants.offerMessageStatusAccepted = 2;
Constants.offerMessageStatusRefused = 3;
Constants.offerMessageStatusPaymentInProgress = 4;
Constants.offerMessageStatusCompleted = 5;
Constants.offerMessageStatusRejected = 6;

Constants.recombeeProductTypesMap = {
  1: "Video",
  2: "Short Video",
  3: "Audio",
  4: "Text Story",
  5: "Market Product",
};
Constants.recombeeLiveStreamTypesMap = { live: "Live", event: "Event", market: "Market Live" };

Constants.demoPhoneNumbers = ["+14694687792"];
Constants.developerPhoneNumbers = ["+385976431885", "+385958710207"];

Constants.auctionStatus = {
  INACTIVE: "inactive",
  ACTIVE: "active",
  FINISHED: "finished",
  SOLD: "sold",
  UNSOLD: "unsold",
};
Constants.auctionPaymentMethodType = {
  CREDIT_CARD: "credit_card",
  GLOBAL_BALANCE: "global_balance",
  TRANSFER: "transfer",
};
Constants.auctionPaymentMethodName = {
  CREDIT_CARD: "Credit card",
  GLOBAL_BALANCE: "Global balance",
  TRANSFER: "Transfer",
};
Constants.orderStatus = {
  PAYMENT_PENDING: "payment_pending",
  PAYMENT_COMPLETED: "payment_completed",
  PAYMENT_FAILED: "payment_failed",
  EXPIRED: "expired",
  SHIPPED: "shipped",
  SHIP_BY_EXPIRED: "ship_by_expired",
  CANCELLATION_REQUESTED: "cancellation_requested",
  CANCELED: "canceled",
  SUPPORT_TICKET_OPENED: "support_ticket_opened",
  CLOSED_BY_SUPPORT: "closed_by_support",
  DELIVERED: "delivered",
};

Constants.orderExpirationTime = Config.environment === "production" ? 30 : 7; // 30 minutes in production, 7 minutes otherwise

Constants.shippingLimitInDays = 7;

Constants.restockingFee = 2_000;

Constants.flomAgentPhoneNumbers = ["+2348888888888", "+2349999999999"];

Constants.shippingProviders = [
  { type: "dhl", displayName: "DHL" },
  { type: "ups", displayName: "UPS" },
  { type: "usps", displayName: "USPS" },
  { type: "fedex", displayName: "FedEx" },
  { type: "chilexpress", displayName: "Chilexpress" },
  { type: "blue_express", displayName: "Blue Express" },
  { type: "correos_de_chile", displayName: "Correos de Chile" },
  { type: "starken", displayName: "Starken" },
  { type: "gig_logistics", displayName: "GIG Logistics" },
  { type: "aramex", displayName: "Aramex" },
  { type: "jumia_logistics", displayName: "Jumia Logistics" },
  { type: "other", displayName: "Other" },
];

module.exports = Object.freeze(Constants);
