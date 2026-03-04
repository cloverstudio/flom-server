const ResponseCodes = {};

ResponseCodes.responsecodeSucceed = 1;
ResponseCodes.responsecodeUnknownError = 4000000;

ResponseCodes.responsecodeSigninNoUserid = 4000001;
ResponseCodes.responsecodeSigninNoPassword = 4000002;
ResponseCodes.responsecodeSigninNoOrganizationId = 4000003;
ResponseCodes.responsecodeSigninWrongSecret = 4000004;
ResponseCodes.responsecodeSigninWrongOrganizationId = 4000005;
ResponseCodes.responsecodeSigninWrongUserCredentials = 4000006;
ResponseCodes.responsecodeSigninInvalidToken = 4000007;
ResponseCodes.responsecodeUpdateProfileInvalidName = 4000008;
ResponseCodes.responsecodeUpdateProfileInvalidFile = 4000009;
ResponseCodes.responsecodeUpdatePasswordWrongCurrentPassword = 4000010;
ResponseCodes.responsecodeUpdatePasswordWrongNewPassword = 4000011;
ResponseCodes.responsecodeUpdateRoomWrongRoomId = 4000012;
ResponseCodes.responsecodeUpdateRoomWrongRoomName = 4000013;
ResponseCodes.responsecodeUpdateRoomWrongFile = 4000014;
ResponseCodes.responsecodeLeaveRoomWrongRoomId = 4000015;
ResponseCodes.responsecodeGetOnlineStatusInvalidUserId = 4000016;
ResponseCodes.responsecodeUserDetailInvalidUserId = 4000017;
ResponseCodes.responsecodeGroupDetailInvalidGroupId = 4000018;
ResponseCodes.responsecodeRoomDetailInvalidRoomId = 4000019;
ResponseCodes.responsecodeAddToFavoriteNoMessageId = 4000020;
ResponseCodes.responsecodeAddToFavoriteInvalidMessageId = 4000021;
ResponseCodes.responsecodeAddToFavoriteExistedMessageId = 4000022;
ResponseCodes.responsecodeRemoveFromFavoriteNoMessageId = 4000023;
ResponseCodes.responsecodeRemoveFromFavoriteInvalidMessageId = 4000024;
ResponseCodes.responsecodeAddUsersToRoomWrongRoomId = 4000025;
ResponseCodes.responsecodeAddUsersToRoomWrongUserId = 4000026;
ResponseCodes.responsecodeRemoveUsersFromRoomWrongRoomId = 4000027;
ResponseCodes.responsecodeRemoveUsersFromRoomWrongUserId = 4000028;
ResponseCodes.responsecodeForwardMessageInvalidChatId = 4000029;
ResponseCodes.responsecodeForwardMessageInvalidMessageId = 4000030;
ResponseCodes.responsecodeSavePushTokenWrongToken = 4000031;
ResponseCodes.responsecodeStickersWrongOrganizationId = 4000032;
ResponseCodes.responsecodeAddInboundHookWrongTargetType = 4000033;
ResponseCodes.responsecodeAddInboundHookWrongTargetId = 4000034;
ResponseCodes.responsecodeAddInboundHookWrongUserId = 4000035;
ResponseCodes.responsecodeAddOutgoingHookWrongURL = 4000036;
ResponseCodes.responsecodeAddOutgoingHookWrongUserId = 4000037;
ResponseCodes.responsecodeUpdateInboundHookWrongTargetType = 4000038;
ResponseCodes.responsecodeUpdateInboundHookWrongTargetId = 4000039;
ResponseCodes.responsecodeUpdateInboundHookWrongHookId = 4000040;
ResponseCodes.responsecodeUpdateOutgoingHookWrongURL = 4000041;
ResponseCodes.responsecodeUpdateOutgoingHookWrongHookId = 4000042;
ResponseCodes.responsecodeRemoveInboundHookWrongHookId = 4000043;
ResponseCodes.responsecodeRemoveOutgoingHookWrongHookId = 4000044;
ResponseCodes.responsecodeAddOutgoingHookWrongTargetType = 4000045;
ResponseCodes.responsecodeAddOutgoingHookWrongTargetId = 4000046;
ResponseCodes.responsecodeUpdateOutgoingHookWrongTargetType = 4000047;
ResponseCodes.responsecodeUpdateOutgoingHookWrongTargetId = 4000048;
ResponseCodes.responsecodeInboundHookWringIdentifier = 4000049;
ResponseCodes.responsecodeSigninNoOrganizationid = 4000050;
ResponseCodes.responsecodePingOKInvalidParam = 4000051;
ResponseCodes.responsecodeLoginInvalidParam = 4000052;
ResponseCodes.responsecodeCallingInvalidParamInvalidUserId = 4000053;
ResponseCodes.responsecodeCallingInvalidParamNoMediaType = 4000054;
ResponseCodes.responsecodeCallingInvalidParamNoRejectType = 4000055;
ResponseCodes.responsecodeFailedToSendMessage = 4000056;
ResponseCodes.responsecodeMaxRoomNumber = 4000057;
ResponseCodes.responsecodeMuteWrongParam = 4000058;
ResponseCodes.responsecodeBlockWrongParam = 4000059;
ResponseCodes.responsecodeUserBlocked = 4000060;
ResponseCodes.responsecodeDeviceRejected = 4000061;
ResponseCodes.responsecodeSignupNoOrganizationId = 4000062;
ResponseCodes.responsecodeSignupUserAlreadyVerified = 4000063;
ResponseCodes.responsecodeSignupInvalidActivationCode = 4000064;
ResponseCodes.responsecodeSignupInvalidUserName = 4000065;
ResponseCodes.responsecodeSignupInvalidPassword = 4000066;
ResponseCodes.responsecodeMessageNoPermission = 4000067;

ResponseCodes.responsecodeMessageListInvalidParam = 4000068;
ResponseCodes.responsecodeMessageFileUploadFailed = 4000069;

ResponseCodes.resCodeSocketSendMessageNoRoomID = 4000070;
ResponseCodes.resCodeSocketSendMessageNoUserId = 4000071;
ResponseCodes.resCodeSocketSendMessageNoType = 4000072;
ResponseCodes.resCodeSocketSendMessageNoMessage = 4000073;
ResponseCodes.resCodeSocketSendMessageNoLocation = 4000074;
ResponseCodes.resCodeSocketDeleteNoMessageID = 4000075;
ResponseCodes.resCodeSocketDeleteNoUserID = 4000076;
ResponseCodes.resCodeSocketUnknownError = 4000077;
ResponseCodes.resCodeSocketTypingNoUserID = 4000078;
ResponseCodes.resCodeSocketTypingNoRoomID = 4000079;
ResponseCodes.resCodeSocketTypingNoType = 4000080;
ResponseCodes.resCodeSocketTypingFaild = 4000081;
ResponseCodes.resCodeSocketOpenMessageWrongMessageID = 4000082;
ResponseCodes.resCodeSocketOpenMessageNoUserId = 4000083;

ResponseCodes.responsecodeSeenByInvalidMessageId = 4000084;

ResponseCodes.responsecodeNoOrganizationName = 4000085;
ResponseCodes.responsecodeWrongOrganizationName = 4000086;

ResponseCodes.responsecodeSigninUserNotFound = 4000087;
ResponseCodes.responsecodeWrongUserContactId = 4000088;

ResponseCodes.responsecodeAddUsersToRoomUserIsNotOwner = 4000089;
ResponseCodes.responsecodeRemoveUsersFromRoomUserIsNotOwner = 4000090;

ResponseCodes.resCodeSocketUpdateNoMessageID = 4000091;
ResponseCodes.resCodeSocketUpdateNoUserID = 4000092;

ResponseCodes.resCodeSaveNoteNoChatID = 4000093;
ResponseCodes.resCodeLoadNoteNoChatID = 4000094;

ResponseCodes.resCodeSocketDeliverMessageNoUserId = 4000095;
ResponseCodes.resCodeSocketDeliverMessageNoMessageId = 4000096;
ResponseCodes.resCodeSocketDeliverMessageWrongUserId = 4000097;
ResponseCodes.resCodeSocketDeliverMessageWrongMessageId = 4000098;

ResponseCodes.responsecodeDeliverMessageNoMessageId = 4000099;
ResponseCodes.responsecodeDeliverMessageWrongMessageId = 4000100;
ResponseCodes.responsecodeDeliverMessageUserIsSender = 4000101;

ResponseCodes.responsecodeNoTypeParameter = 443127;
ResponseCodes.responsecodeNoReferenceIdParameter = 443129;
ResponseCodes.responsecodeUserIdNotValid = 443030;
ResponseCodes.responsecodeUserNotFound = 443040;
ResponseCodes.responsecodeTransferNotFound = 443081;
ResponseCodes.responsecodeSupportTicketIdNotValid = 443340;
ResponseCodes.responsecodeSupportTicketNotFound = 443341;
ResponseCodes.responsecodeWrongStatus = 443342;
ResponseCodes.responsecodePayoutNotFound = 443343;

ResponseCodes.responsecodeNewStatusSameAsOldStatus = 443344;

ResponseCodes.responsecodeNoToParameter = 443350;
ResponseCodes.responsecodeInvalidEmail = 443351;
ResponseCodes.responsecodeNoTextParameter = 443352;

ResponseCodes.responsecodePinChatWrongPinParam = 4000102;
ResponseCodes.responsecodePinChatWrongChatIdParam = 4000103;

ResponseCodes.responsecodeNoUserId = 4000110;
ResponseCodes.responsecodeNoFlomAgentId = 4000111;
ResponseCodes.responsecodeFlomAgentNotVerified = 4000112;

ResponseCodes.responsecodeNoMainCategoryId = 4000113;
ResponseCodes.responsecodeNoSubCategoryId = 4000114;
ResponseCodes.responsecodeNoVehicleMakeId = 4000115;
ResponseCodes.responsecodeNoTypeId = 4000116;

ResponseCodes.resCodeSocketMessageReactionNoRoomId = 4000117;
ResponseCodes.resCodeSocketMessageReactionNoUserId = 4000118;
ResponseCodes.resCodeSocketMessageReactionNoMessageId = 4000119;
ResponseCodes.resCodeSocketMessageReactionNoReactionString = 4000120;
ResponseCodes.resCodeSocketMessageReactionInvalidRoomId = 4000121;

ResponseCodes.resCodeAuctionInvalidLiveStreamId = 4000122;
ResponseCodes.resCodeAuctionInvalidAuctionId = 4000123;
ResponseCodes.resCodeAuctionLiveStreamNotFound = 4000124;
ResponseCodes.resCodeAuctionAuctionNotFound = 4000125;
ResponseCodes.resCodeAuctionInvalidBidData = 4000126;
ResponseCodes.resCodeAuctionInvalidUserId = 4000127;
ResponseCodes.resCodeAuctionUserNotFound = 4000128;
ResponseCodes.resCodeAuctionInvalidToken = 4000129;
ResponseCodes.resCodeAuctionUserBannedFromAuctions = 4000130;
ResponseCodes.resCodeAuctionAuctionEnded = 4000131;
ResponseCodes.resCodeAuctionUserHasNoAuctionPaymentMethod = 4000132;
ResponseCodes.resCodeAuctionGlobalBalanceTooLow = 4000133;
ResponseCodes.resCodeAuctionNoShippingAddress = 4000134;

ResponseCodes.responsecodeFloodDetection = 4000130;

ResponseCodes.responsecodeProductNoProductName = 4000120;
ResponseCodes.responsecodeProductNoType = 400121;
ResponseCodes.responsecodeFileNotSupported = 400122;
ResponseCodes.responsecodeInvalidFile = 400123;
ResponseCodes.responsecodeErrorWithVideoFile = 400124;
ResponseCodes.responsecodeProductNoProductCategoryId = 400125;
ResponseCodes.responsecodeProductInvalidType = 400126;
ResponseCodes.responsecodeProductInvalidVideoLength = 400127;
ResponseCodes.responsecodeProductInvalidCategoryId = 400128;
ResponseCodes.responsecodeProductCategoryNotFound = 400129;
ResponseCodes.responsecodeProductNoProductCategory = 400130;
ResponseCodes.responsecodeProductInvalidCategory = 400131;
ResponseCodes.responsecodeProductAlreadyFeatured = 400132;
ResponseCodes.responsecodeProductIsNotFeatured = 400133;
ResponseCodes.responsecodeCannotEditCurrency = 400134;
ResponseCodes.responsecodeProductNoProductDescription = 400140;
ResponseCodes.responsecodeProductNoProductPrice = 400150;
ResponseCodes.responsecodeProductNotFound = 400160;
ResponseCodes.responsecodeNoLinkParameter = 400161;
ResponseCodes.responsecodeLinkNotValid = 400162;
ResponseCodes.responsecodeLinkedProductNotFound = 400163;
ResponseCodes.responsecodeTransactionNotFound = 400165;
ResponseCodes.responsecodeProductDeleteError = 400170;
ResponseCodes.responsecodeNoPhoneNumber = 400180;
ResponseCodes.responsecodeNoFinancialInstitutionCode = 400190;
ResponseCodes.responsecodeNoMerchantDOB = 400200;
ResponseCodes.responsecodeNoActivationCode = 400210;
ResponseCodes.responsecodeCustomerNotFound = 400220;
ResponseCodes.responsecodeMerchantNotFound = 400230;
ResponseCodes.responsecodeNoCustomerMsisdn = 400240;
ResponseCodes.responsecodeNoCustomerEmail = 400250;
ResponseCodes.responsecodeNoMerchantCode = 400260;
ResponseCodes.responsecodeInvalidMerchantCode = 400261;
ResponseCodes.responsecodeNoSearchTerm = 400265;
ResponseCodes.responsecodeNoAmount = 400270;
ResponseCodes.responsecodeNoUserName = 400271;
ResponseCodes.responsecodeUserAlreadyDeleted = 400272;
ResponseCodes.responsecodeUserDeleted = 400273;
ResponseCodes.responsecodeNoValidCustomerMsisdn = 400280;
ResponseCodes.responsecodeNoValidCustomerEmail = 400290;
ResponseCodes.responsecodeRojaServerError = 400300;
ResponseCodes.responsecodeNoProductId = 400310;
ResponseCodes.responsecodeTransactionTypeNotFound = 400311;
ResponseCodes.responsecodeNoProductRate = 400320;
ResponseCodes.responsecodeNoReviewComment = 400330;
ResponseCodes.responsecodeWrongPhoneNumberFormat = 400340;
ResponseCodes.responsecodeNoOperationId = 400350;
ResponseCodes.responsecodeNoAccountId = 400360;
ResponseCodes.responsecodeSmsSendFail = 400370;
ResponseCodes.responsecodeNoTransactionId = 400380;
ResponseCodes.responsecodeNoTransactionFound = 400390;
ResponseCodes.responsecodeTransactionAlreadyDone = 400395;
ResponseCodes.responsecodeNoAdminId = 400400;
ResponseCodes.responsecodeNoRoomId = 400410;
ResponseCodes.responsecodeNoRoomFound = 400420;
ResponseCodes.responsecodeUserIsNotAdmin = 400430;
ResponseCodes.responsecodeUserIsAlreadyAdmin = 400440;
ResponseCodes.responsecodeUserIsNotAdmin = 400450;
ResponseCodes.responsecodeUserIsOwner = 400460;
ResponseCodes.responsecodeNotProductOwner = 400470;
ResponseCodes.responsecodeAddUsersToRoomUserIsNotAdmin = 400480;
ResponseCodes.responsecodeProductFileIsNotVideo = 400490;
ResponseCodes.responsecodeUserIsNotProductOwner = 400500;
ResponseCodes.responsecodeProductNoProductId = 400510;
ResponseCodes.responsecodeProductNoProductFileId = 400520;
ResponseCodes.responsecodeOrderError = 400530;
ResponseCodes.responsecodeProductNoProductLocation = 400540;
ResponseCodes.responsecodeProductProductLocationWrongFormat = 400550;
ResponseCodes.responsecodeProductNoUserLocation = 400560;
ResponseCodes.responsecodeProductNoMerchantLocation = 400570;
ResponseCodes.responsecodeMerchantLocationWrongFormat = 400580;
ResponseCodes.responsecodeProductWrongProductIdFormat = 400600;
ResponseCodes.responsecodeNoMerchantCodeFound = 400610;
ResponseCodes.responsecodeNoPushToken = 400620;
ResponseCodes.responsecodeNoUUID = 400630;
ResponseCodes.responsecodeClientIdIsRequired = 400640;
ResponseCodes.responsecodeOperaionIdIsRequired = 400650;
ResponseCodes.responsecodeResultIsRequired = 400660;
ResponseCodes.responsecodeFailedTransaction = 400670;
ResponseCodes.responsecodeCategoryNotFound = 400680;
ResponseCodes.responsecodeNoTransactions = 400690;
ResponseCodes.responsecode9MobileReject = 400700;
ResponseCodes.responsecodeNoReceiver = 400701;
ResponseCodes.responsecodeNoSender = 400702;
ResponseCodes.responsecodeInvalidAmount = 400703;
ResponseCodes.responsecodeBankNotAvailable = 400710;
ResponseCodes.responsecodeProductNoOwnerId = 400720;
ResponseCodes.responsecodeSenderInvalidCountry = 400730;
ResponseCodes.responsecodeInvalidPaymentType = 400740;
ResponseCodes.responsecodeSenderInvalidReceiverIdOrPhone = 400750;
ResponseCodes.responsecodeReceiverInvalidCountry = 400731;
ResponseCodes.responsecodeUserNotFound = 4000760;
ResponseCodes.responsecodeUnknownPushType = 4000770;
ResponseCodes.responsecodeProductAlreadyLiked = 4000780;
ResponseCodes.responsecodeProductNotLiked = 400790;
ResponseCodes.responsecodeProductNotDisliked = 400800;
ResponseCodes.responsecodeUserNoUserId = 400810;
ResponseCodes.responsecodeUserAlreadyFollowed = 400820;
ResponseCodes.responsecodeUserNotFollowed = 400830;
ResponseCodes.responsecodeUserNotUnFollowed = 400840;
ResponseCodes.responsecodeUserWrongUserIdFormat = 400850;
ResponseCodes.responsecodeInvalidMarketingAction = 400880;
ResponseCodes.responsecodeNoMarketingMessage = 400890;
ResponseCodes.responsecodeNoMarketingProductId = 400900;
ResponseCodes.responsecodeNotValidToId = 400910;
ResponseCodes.responsecodePhoneNumberNotFound = 400920;
ResponseCodes.responsecodeInvalidUUID = 400930;
ResponseCodes.responsecodeAppNotfound = 400940;

ResponseCodes.responsecodeSendMessageLocalIDAlreadyExists = 401000;
ResponseCodes.responsecodeSendMessageInvalidRoomID = 401001;
ResponseCodes.responsecodeSendMessageNoPermission = 401002;
ResponseCodes.responsecodeSendMessageUserBlocked = 401003;

ResponseCodes.responsecodeSmartPaypalNoOrder = 410000;
ResponseCodes.responsecodeSmartPaypalNoTransaction = 410010;
ResponseCodes.responsecodeSmartPaypalFetchingDataError = 410020;
ResponseCodes.responsecodeSmartPaypalNoMatchAmounts = 410030;
ResponseCodes.responsecodeSmartPaypalNoReceiverOrSenderModel = 410040;
ResponseCodes.responsecodeSmartPaypalErrorWhileProccesingPayment = 410050;

ResponseCodes.responsecodePaypalNoNonce = 420000;
ResponseCodes.responsecodePaypalNoSenderId = 420010;
ResponseCodes.responsecodePaypalNoAmount = 420020;
ResponseCodes.responsecodePaypalNoReceiverPhoneNumber = 420030;
ResponseCodes.responsecodePaypalNoReceiverUserError = 420040;
ResponseCodes.responsecodePaypalNoSenderUserError = 420050;
ResponseCodes.responsecodePaypalTransactionError = 420060;
ResponseCodes.responsecodePaypalSaleError = 420070;
ResponseCodes.responsecodePaypalAirtimeError = 420080;

ResponseCodes.responsecodeDidWWPhoneNumberReservedMoreThanOnce = 430000;
ResponseCodes.responsecodeDidWWPhoneNumberNotExistsOrNotRes = 430001;
ResponseCodes.responsecodeDidWWNoEntryFromCb = 430002;

ResponseCodes.responsecodeInvalidReceiversError = 430700;
ResponseCodes.responsecodeInvalidGettingReceiversError = 430800;
ResponseCodes.responsecodeErrorWhileGettingAccountsFromSolano = 430900;
ResponseCodes.responsecodeErrorWhileGettingAccountsFromOnDemand = 431000;

// mCash error codes
ResponseCodes.responsecodeMCashStatusUnknown = 430010;
ResponseCodes.responsecodeMCashInvalidSender = 430020;
ResponseCodes.responsecodeMCashDoNotHonor = 430030;
ResponseCodes.responsecodeMCashDormantAccount = 430040;
ResponseCodes.responsecodeMCashInvalidAccount = 430050;
ResponseCodes.responsecodeMCashAccountNameMismatch = 430060;
ResponseCodes.responsecodeMCashRequestProcessingInProgress = 430070;
ResponseCodes.responsecodeMCashInvalidTransaction = 430080;
ResponseCodes.responsecodeMCashInvalidAmount = 430090;
ResponseCodes.responsecodeMCashInvalidBatchNumber = 430100;
ResponseCodes.responsecodeMCashInvalidSessionOrRecordID = 430110;
ResponseCodes.responsecodeMCashUnknownBankCodeOrRequestorID = 430120;
ResponseCodes.responsecodeMCashInvalidChannel = 430130;
ResponseCodes.responsecodeMCashWrongMethodCall = 430140;
ResponseCodes.responsecodeMCashNoActionTaken = 430150;
ResponseCodes.responsecodeMCashInvalidMerchant = 430160;
ResponseCodes.responsecodeMCashUnableToLocateRecord = 430170;
ResponseCodes.responsecodeMCashDuplicateRecord = 430180;
ResponseCodes.responsecodeMCashFormatError = 430190;
ResponseCodes.responsecodeMCashSuspectedFraud = 430200;
ResponseCodes.responsecodeMCashContactSendingBank = 430210;
ResponseCodes.responsecodeMCashNoSufficientFunds = 430220;
ResponseCodes.responsecodeMCashTransactionNotPermittedToSender = 430230;
ResponseCodes.responsecodeMCashTransactionNotPermittedOnChannel = 430240;
ResponseCodes.responsecodeMCashTransferLimitExceeded = 430250;
ResponseCodes.responsecodeMCashSecurityViolation = 430260;
ResponseCodes.responsecodeMCashExceedsWithdrawalFrequency = 430270;
ResponseCodes.responsecodeMCashResponseReceivedTooLate = 430280;
ResponseCodes.responsecodeMCashUnsuccessfulAccountOrAmountBlock = 430290;
ResponseCodes.responsecodeMCashUnsuccessfulAccountOrAmountUnblock = 430300;
ResponseCodes.responsecodeMCashEmptyMandateReferenceNumber = 430310;
ResponseCodes.responsecodeMCashBeneficiaryBankNotAvailable = 430320;
ResponseCodes.responsecodeMCashRoutingError = 430330;
ResponseCodes.responsecodeMCashDuplicateTransaction = 430340;
ResponseCodes.responsecodeMCashSystemMalfunction = 430350;
ResponseCodes.responsecodeMCashTimeoutWaitingForResponseFromDestination = 430360;
ResponseCodes.responsecodeMCashMaximumTransactionAmountSetByNIBSSExceeded = 430370;
ResponseCodes.responsecodeMCashUnknownRequestor = 430380;
ResponseCodes.responsecodeMCashPayerBlacklisted = 430390;
ResponseCodes.responsecodeMCashUnknownMerchantCode = 430400;
ResponseCodes.responsecodeMCashTransactionNotPermittedToMerchant = 430410;
ResponseCodes.responsecodeTransactionNotPermittedToNonMerchant = 430411;
ResponseCodes.responsecodeMCashMaximumTransactionAmountPermittedToMerchantExceeded = 430420;
ResponseCodes.responsecodeMCashMaximumDailyTransactionLimitPermittedToPayerExceeded = 430430;
ResponseCodes.responsecodeMCashMaximumTransactionAmountPermittedToPayerExceeded = 430440;
ResponseCodes.responsecodeMCashInvalidBVN = 430450;
ResponseCodes.responsecodeMCashMoreThanOneBVNTiedToPhoneNumber = 430460;
ResponseCodes.responsecodeMCashNoBVNTiedToAccount = 430470;
ResponseCodes.responsecodeMCashNoAccountReturned = 430480;
ResponseCodes.responsecodeMCashNameEnquiryFailed = 430490;
ResponseCodes.responsecodeMCashWrongDateOfBirth = 430500;
ResponseCodes.responsecodeMCashPhoneNumberSwapped = 430510;
ResponseCodes.responsecodeMCashMultipleMerchantCodeRequest = 430520;

ResponseCodes.responsecodeUsernameNotAvailable = 430530;
ResponseCodes.responsecodeUsernameTooShort = 430531;
ResponseCodes.responsecodeUsernameInvalidCharsUsed = 430535;
ResponseCodes.responsecodeNoChatIdOrHistoryId = 430540;
ResponseCodes.responsecodeHistoryNotFound = 430550;
ResponseCodes.responsecodeChatIdNotFound = 430560;
ResponseCodes.responsecodeInvalidUnreadCount = 430570;
ResponseCodes.responsecodeNotMerchantAccount = 430580;
ResponseCodes.responsecodeNoSelectedBankAccount = 430590;

ResponseCodes.responsecodeUsersNotFound = 430610;

ResponseCodes.responsecodeProductCantBeBoughtWithPayPal = 430540;

ResponseCodes.responsecodeUserIdsMustBeDefined = 430580;
ResponseCodes.responsecodeUserIdsMustBeArray = 430590;
ResponseCodes.responsecodePhoneNumbersMustBeArray = 430600;
ResponseCodes.responsecodeInvalidSku = 4307007;
ResponseCodes.responsecodeInvalidRoomID = 430800;
ResponseCodes.responsecodeReceiversAndProductsDontMatch = 430901;
ResponseCodes.responsecodeTimeToVerifyExpired = 441000;
ResponseCodes.responsecodeLoginAttemptNotFound = 441100;
ResponseCodes.responsecodeLoginAttemptUUIDsDontMatch = 441200;
ResponseCodes.responsecodeLoginAttemptNotVerified = 441300;
ResponseCodes.responsecodeLoginAttemptAllreadyCompleted = 441400;
ResponseCodes.responsecodeUsernameTaken = 441500;
ResponseCodes.responsecodeLoginAttemptNoOldDeviceFound = 441600;
ResponseCodes.responsecodeNoDeviceName = 441700;
ResponseCodes.responsecodeCarrierNotAllowed = 401060;
ResponseCodes.responsecodePhoneNumberIsBlocked = 401061;

ResponseCodes.responsecodeProfileUsernameTaken = 443001;

ResponseCodes.responsecodeUserNoCountryCode = 443060;

ResponseCodes.responsecodeNoCurrencyFound = 443063;

ResponseCodes.responsecodeNoCardNumber = 443082;
ResponseCodes.responsecodeBuyCardNumberLength = 443083;
ResponseCodes.responsecodeBuyCreditCardIncorrect = 443084;
ResponseCodes.responsecodeBuyNoExpirationDate = 443085;
ResponseCodes.responsecodeBuyExpirationDateLength = 443086;
ResponseCodes.responsecodeBuyExpirationDateIncorrect = 443087;
ResponseCodes.responsecodeBuyNoCardCode = 443088;
ResponseCodes.responsecodeBuyCardCodeLength = 443089;
ResponseCodes.responsecodeBuyCardCodeIncorrect = 443090;

ResponseCodes.responsecodePaymentMethodNotFound = 443091;
ResponseCodes.responsecodeInvalidPaymentMethod = 443092;
ResponseCodes.responsecodeTransferTypeNotFound = 443093;
ResponseCodes.responsecodePaymentMethodNotAvailableForCountry = 443094;
ResponseCodes.responsecodePaymentMethodLockedForUser = 443095;

ResponseCodes.responsecodeNoFirstName = 443100;
ResponseCodes.responsecodeNoLastName = 443101;
ResponseCodes.responsecodeNoAddress = 443102;
ResponseCodes.responsecodeNoZip = 443103;

ResponseCodes.responsecodeTransferWrongStatus = 443105;

ResponseCodes.responsecodeInvalidPhoneNumber = 443107;
ResponseCodes.responsecodeNoSavedPaymentMethods = 443108;
ResponseCodes.responsecodeSavedPaymentMethodNotFound = 443109;

ResponseCodes.responsecodeFailedCreatingPaymentProfile = 443110;
ResponseCodes.responsecodeFailedDeletingPaymentProfile = 443111;

ResponseCodes.responseCodeCountryDoesNotMatchPhoneCountry = 443123;

ResponseCodes.responsecodeTransferIdNotValid = 443148;

ResponseCodes.responsecodeNoUsername = 443210;
ResponseCodes.responsecodeNoPassword = 443211;
ResponseCodes.responsecodeWrongUsername = 443212;
ResponseCodes.responsecodeWrongPassword = 443213;
ResponseCodes.responsecodeNoRole = 443214;
ResponseCodes.responsecodeWrongRole = 443215;
ResponseCodes.responsecodeNoEmail = 443216;
ResponseCodes.responsecodeInvalidPassword = 443217;
ResponseCodes.responsecodeNotValidId = 443218;
ResponseCodes.responsecodeNoCode = 443219;

ResponseCodes.responsecodeUsernameEmpty = 443220;
ResponseCodes.responsecodeWrongModerationStatusParameter = 443221;
ResponseCodes.responsecodeWrongSortByParameter = 443222;
ResponseCodes.responsecodeWrongOrderByParameter = 443223;
ResponseCodes.responsecodeProductNameEmpty = 443224;
ResponseCodes.responsecodeInvalidProductId = 443225;
ResponseCodes.responsecodeInvalidTypeParameter = 443226;
ResponseCodes.responsecodeCanNotUpdateProduct = 443227;
ResponseCodes.responsecodeWrongVisibilityParameter = 443228;

ResponseCodes.responsecodeInvalidUserId = 443230;
ResponseCodes.responsecodeNoAction = 443231;
ResponseCodes.responsecodeInvalidAction = 443232;

ResponseCodes.responsecodeUserNotCreator = 443233;
ResponseCodes.responsecodeMembershipsMaxCountReached = 443234;
ResponseCodes.responsecodeNoName = 443235;
ResponseCodes.responsecodeNoDescription = 443236;
ResponseCodes.responsecodeNoBenefits = 443237;
ResponseCodes.responsecodeInvalidBenefit = 443238;
ResponseCodes.responsecodeWrongOrderParameter = 443239;
ResponseCodes.responsecodeInvalidMembershipId = 443240;
ResponseCodes.responsecodeMembershipNotFound = 443241;
ResponseCodes.responsecodeUserNotMembershipCreator = 443242;
ResponseCodes.responsecodeUserAlreadyMember = 443243;
ResponseCodes.responsecodeUserNotMember = 443244;
ResponseCodes.responsecodeUserAlreadyCreatorsMember = 443245;
ResponseCodes.responsecodeNoActiveRecurringPayment = 443246;
ResponseCodes.responsecodeInvalidMembershipToUpgradeTo = 443247;
ResponseCodes.responsecodeMemebershipImageInvalid = 443248;

ResponseCodes.responsecodeInvalidCode = 443387;
ResponseCodes.responsecodeEmailNotVerified = 443389;

ResponseCodes.responsecodeAlreadyReviewed = 443390;
ResponseCodes.responsecodeFileNotFound = 443391;

ResponseCodes.responsecodeInvalidReviewId = 443392;
ResponseCodes.responsecodeReviewNotFound = 443393;
ResponseCodes.responsecodeReviewEditForbidden = 443394;
ResponseCodes.responsecodeFilesToDeleteError = 443395;

ResponseCodes.responsecodeNoReCaptchaParameter = 443400;
ResponseCodes.responsecodeReCaptchaFailed = 443401;
ResponseCodes.responsecodeNeedTwoFactorAuth = 443402;
ResponseCodes.responsecodeErrorWhenSendingCode = 443403;
ResponseCodes.responsecodeNoTempToken = 443404;

ResponseCodes.responsecodeNoTitle = 443405;
ResponseCodes.responsecodeNoUserIds = 443406;
ResponseCodes.responsecodeUserIdsEmpty = 443407;
ResponseCodes.responsecodeNoContentType = 443408;
ResponseCodes.responsecodeWrongContentType = 443409;
ResponseCodes.responsecodeNoContentId = 443410;
ResponseCodes.responsecodeInvalidObjectId = 443411;
ResponseCodes.responsecodeMarketingNotificationNotFound = 443412;

ResponseCodes.responsecodeNoTemplateName = 443415;
ResponseCodes.responsecodeInvalidTemplateId = 443416;
ResponseCodes.responsecodeTemplateNotFound = 443417;

ResponseCodes.responsecodeNoStartDate = 443418;
ResponseCodes.responsecodeNoEndDate = 443419;
ResponseCodes.responsecodeNoDateOfBirth = 443420;
ResponseCodes.responsecodeNoStreetName = 443421;
ResponseCodes.responsecodeNoStreetNumber = 443422;
ResponseCodes.responsecodeNoCity = 443423;
ResponseCodes.responsecodeNoZip = 443424;
ResponseCodes.responsecodeNoBankCountry = 443425;
ResponseCodes.responsecodeNoBankAccountNumber = 443426;
ResponseCodes.responsecodeInvalidFilesCount = 443427;
ResponseCodes.responsecodeInvalidFileType = 443428;
ResponseCodes.responsecodeMerchantApplicationNotFound = 443429;
ResponseCodes.responsecodeInvalidApprovalStatus = 443430;
ResponseCodes.responsecodeNoBankName = 443431;
ResponseCodes.responsecodePaypalEmailNotFound = 443432;
ResponseCodes.responsecodeNoAmountReceived = 443433;
ResponseCodes.responsecodeApplicationAlreadyExists = 443434;
ResponseCodes.responsecodePaypalEmailNotConfirmed = 443438;

ResponseCodes.responsecodeInvalidOrExpiredTempToken = 443435;
ResponseCodes.responsecodeTooManySMSRetries = 443436;
ResponseCodes.responsecodeFailedHashCheck = 443437;
ResponseCodes.responsecodeInvalidSMSPrice = 443439;

ResponseCodes.responsecodeInvalidLatParameter = 443440;
ResponseCodes.responsecodeInvalidLonParameter = 443441;

ResponseCodes.responsecodeInvalidStartLatParameter = 443450;
ResponseCodes.responsecodeInvalidStartLonParameter = 443451;
ResponseCodes.responsecodeInvalidEndLatParameter = 443452;
ResponseCodes.responsecodeInvalidEndLonParameter = 443453;

ResponseCodes.responsecodeParentNotFound = 443455;
ResponseCodes.responsecodeNoGroup = 443456;
ResponseCodes.responsecodeInvalidGroup = 443457;
ResponseCodes.responsecodeGroupNotAllowed = 443458;

ResponseCodes.responsecodeNoToken = 443460;
ResponseCodes.responsecodeInvalidToken = 443461;
ResponseCodes.responsecodeTokenExpired = 443462;

ResponseCodes.responsecodeTribeInvalidName = 443470;
ResponseCodes.resposnecodeTribeInvalidDescription = 443471;
ResponseCodes.responsecodeTribeImageInvalid = 443472;
ResponseCodes.responsecodeTribeBadId = 443473;
ResponseCodes.responsecodeTribeNotFound = 443474;
ResponseCodes.responsecodeTribeEditNotAllowed = 443475;
ResponseCodes.responsecodeTribeAlreadyJoined = 443476;
ResponseCodes.responsecodeTribeAlreadyRequested = 443477;
ResponseCodes.responsecodeTribeOwnerCantLeave = 443478;
ResponseCodes.responsecodeTribePendingMemberNotFound = 443479;
ResponseCodes.responsecodeTribeFull = 443480;
ResponseCodes.responsecodeTribeOwnerOnlyDelete = 443481;
ResponseCodes.responsecodeTribeNoInvitationPending = 443482;
ResponseCodes.responsecodeTribeEmptySearchQuery = 443483;
ResponseCodes.responsecodeTribeMembersWithRolesParsing = 443484;
ResponseCodes.responsecodeTribeInvalidMembersToInvite = 443485;
ResponseCodes.responsecodeTribeMaxCoOwnerCountReached = 443486;
ResponseCodes.responsecodeTribeUnauthorized = 443487;
ResponseCodes.responsecodeTribeUserNotMember = 443488;

ResponseCodes.responsecodeNoTribeIds = 443490;

ResponseCodes.responsecodeVPN = 443493;

ResponseCodes.responsecodeNoNotificationId = 443495;
ResponseCodes.responsecodeInvalidNotificationId = 443496;

ResponseCodes.responsecodeCallPaymentServiceError = 443500;

ResponseCodes.responsecodeCantDeleteBecauseRecurringPayment = 443505;

ResponseCodes.responsecodeNoFlomojiId = 443601;
ResponseCodes.responsecodeFlomojiNotFound = 443602;
ResponseCodes.responsecodeNoFlomojiTitle = 443603;
ResponseCodes.responsecodeNoFlomojiAmount = 443604;
ResponseCodes.responsecodeNoFlomojiPosition = 443605;
ResponseCodes.responsecodeImageFileInputError = 443606;
ResponseCodes.responsecodeOnlyImageFilesAllowed = 443607;
ResponseCodes.responsecodeDeleteFlomojiProblem = 443608;
ResponseCodes.responsecodeExtensionNotAllowed = 443609;
ResponseCodes.responsecodeAmountNotANumber = 443613;
ResponseCodes.responsecodePositionNotANumber = 443614;
ResponseCodes.responsecodeInputNotMultipart = 443615;
ResponseCodes.responsecodeNoFlomojiKeywords = 443616;
ResponseCodes.responsecodeNoFlomojiCreditsAmount = 443617;
ResponseCodes.responsecodeCreditsAmountNotANumber = 443618;

ResponseCodes.responsecodeNoCompanyName = 443630;
ResponseCodes.responsecodeNoCompanyWebSite = 443631;
ResponseCodes.responsecodeNoBusinessEmail = 443632;
ResponseCodes.responsecodeNoTalkTicketId = 443633;
ResponseCodes.responsecodeTalkTicketNotFound = 443634;
ResponseCodes.responsecodeNoStatusParameter = 443635;
ResponseCodes.responsecodeInvalidStatusParameter = 443636;

ResponseCodes.responsecodeInvalidInternationalUserParameter = 443640;

ResponseCodes.responsecodeNoMessageParameter = 443670;
ResponseCodes.responsecodeNoPhoneNumbersFile = 443671;
ResponseCodes.responsecodeFileTypeNotSupported = 443672;
ResponseCodes.responsecodeFileInvalidStructure = 443673;
ResponseCodes.responsecodeNoValidPhoneNumbersInFile = 443674;
ResponseCodes.responsecodeTotalSpendingHigherThanSpendingCap = 443675;

ResponseCodes.responsecodeNoBusinessName = 443680;
ResponseCodes.responsecodeNoContactTicketId = 443681;
ResponseCodes.responsecodeContactTicketNotFound = 443682;

ResponseCodes.responsecodeNoCountryCodeParameter = 443690;
ResponseCodes.responsecodeInvalidCountryCode = 443691;
ResponseCodes.responsecodeInviteMessageAlreadyExists = 443692;
ResponseCodes.responsecodeCreateInviteMessageFailed = 443693;
ResponseCodes.responsecodeUpdateInviteMessageFailed = 443694;
ResponseCodes.responsecodeDeleteInviteMessageFailed = 443695;

ResponseCodes.responsecodeNoPackageId = 443700;

ResponseCodes.responsecodeNoLowerLimit = 443705;
ResponseCodes.responsecodeLowerLimitNotANumber = 443706;
ResponseCodes.responsecodeNoEmojiId = 443707;
ResponseCodes.responsecodeEmojiNotFound = 443708;
ResponseCodes.responsecodeDeleteEmojiProblem = 443709;

ResponseCodes.responsecodeNoValueParameter = 443740;
ResponseCodes.responsecodeInvalidValueParameter = 443741;
ResponseCodes.responsecodeSprayValueAlreadyExists = 443742;
ResponseCodes.responsecodeSprayValueDoesNotExist = 443743;

ResponseCodes.responsecodeCreditConversionRateAlreadyExists = 443745;
ResponseCodes.responsecodeCreditConversionRateDoesNotExist = 443746;

ResponseCodes.responsecodeInvalidMinParameter = 443760;
ResponseCodes.responsecodeInvalidMaxParameter = 443761;
ResponseCodes.responsecodePayoutLimitAlreadyExists = 443762;
ResponseCodes.responsecodePayoutLimitDoesNotExist = 443763;

ResponseCodes.responsecodeMissingLimitParameter = 443764;
ResponseCodes.responsecodeInvalidLimitParameter = 443765;
ResponseCodes.responsecodeCreditTransferLimitAlreadyExists = 443766;
ResponseCodes.responsecodeCreditTransferLimitDoesNotExist = 443767;

ResponseCodes.responsecodeInvalidFeeParameter = 443770;
ResponseCodes.responsecodeFeeAlreadyExists = 443771;
ResponseCodes.responsecodeFeeDoesNotExist = 443772;

ResponseCodes.responsecodeBankDoesNotExist = 443775;

ResponseCodes.responsecodeNoEmojiSetNameParameter = 443790;
ResponseCodes.responsecodeNotValidEmojiSetId = 443791;
ResponseCodes.responsecodeNoEmojiSetId = 443792;
ResponseCodes.responsecodeNoEmojiName = 443793;
ResponseCodes.responsecodeNoAnimateParameter = 443794;
ResponseCodes.responsecodeNoIsDefaultParameter = 443795;
ResponseCodes.responsecodeCantRevertToNotDeprecated = 443796;

ResponseCodes.responsecodeMissingParameter = 443800;
ResponseCodes.responsecodeInvalidParameter = 443801;

ResponseCodes.responsecodeEmailAlreadyExists = 443802;
ResponseCodes.responsecodeActivationCodeExpired = 443803;
ResponseCodes.responsecodeActivationCodeInvalid = 443804;

ResponseCodes.responsecodeMissingParameters = 443805;

ResponseCodes.responsecodeInvalidDeviceTypeParameter = 443806;

ResponseCodes.responsecodeTaxRateDoesNotExist = 443807;

ResponseCodes.responsecodeNoSocialMediaTitle = 443810;
ResponseCodes.responsecodeNoSocialMediaURL = 443811;
ResponseCodes.responsecodeSocialMediaAlreadyExists = 443812;
ResponseCodes.responsecodeSocialMediaDoesNotExist = 443813;

ResponseCodes.responsecodeNoEncodedUrl = 443815;

ResponseCodes.responsecodeLnUserNameAlreadyChangedOnce = 443816;
ResponseCodes.responsecodeLnUserNameTooLong = 443817;
ResponseCodes.responsecodeInvalidLnUserName = 443818;
ResponseCodes.responsecodeLnUserNameNotAvailable = 443819;

ResponseCodes.responsecodeUpdateApp = 443820;

ResponseCodes.responsecodeWrongCurrencyParameter = 443062;
ResponseCodes.responsecodeNoCurrencyTo = 443064;

ResponseCodes.responsecodeSensitiveContent = 443821;
ResponseCodes.responsecodeRestrictedContent = 443822;

ResponseCodes.responsecodeApiRequestFailed = 443823;

ResponseCodes.responsecodeInvalidStateCode = 443824;
ResponseCodes.responsecodeInvalidStateCodeOrZipCode = 443825;

ResponseCodes.responsecodeInvalidDeviceType = 443826;

ResponseCodes.responsecodeSoundNotFound = 443830;
ResponseCodes.responsecodeNoSoundTitle = 443831;
ResponseCodes.responsecodeNoSoundArtist = 443832;
ResponseCodes.responsecodeNoAudioFile = 443833;
ResponseCodes.responsecodeNoSoundId = 443834;
ResponseCodes.responsecodeAudioExtensionNotAllowed = 443835;

ResponseCodes.responsecodeCompressingVideoFailed = 443840;
ResponseCodes.responsecodeAudioProductNotFound = 443841;
ResponseCodes.responsecodeAudioProductNotAvailableToUser = 443842;
ResponseCodes.responsecodeAudioProductInUse = 443843;
ResponseCodes.responsecodeCannotUpdateExclusiveProduct = 443844;

ResponseCodes.responsecodeAudioIdMissing = 443850;
ResponseCodes.responsecodeAudioNotFound = 443851;

ResponseCodes.responsecodeLiveStreamNotFound = 443855;
ResponseCodes.responsecodeInvalidName = 443856;
ResponseCodes.responsecodeInvalidTimeStamp = 443857;
ResponseCodes.responsecodeUserNotAllowed = 443858;
ResponseCodes.responsecodeInvalidCommunityIdsParam = 443859;
ResponseCodes.responsecodeInvalidTribeIdsParam = 443860;
ResponseCodes.responsecodeInvalidTribeId = 443861;
ResponseCodes.responsecodeStreamIdAlreadyExists = 443862;
ResponseCodes.responsecodeInvalidLiveStreamId = 443863;
ResponseCodes.responsecodeLiveStreamAlreadyLiked = 443864;
ResponseCodes.responsecodeLiveStreamNotLiked = 443865;
ResponseCodes.responsecodeInvalidTagsParam = 443866;
ResponseCodes.responsecodeInvalidAllowCommentsParam = 443867;
ResponseCodes.responsecodeInvalidAllowSuperBlessParam = 443868;
ResponseCodes.responsecodeInvalidAllowSprayBlessParam = 443869;
ResponseCodes.responsecodeInvalidCohostId = 443870;
ResponseCodes.responsecodeCohostNotFound = 443871;
ResponseCodes.responsecodeTooManyCohosts = 443872;
ResponseCodes.responsecodeOnlyLiveEventCanHaveCohosts = 443873;
ResponseCodes.responsecodeUserIsAlreadyCohost = 443874;
ResponseCodes.responsecodeLiveStreamAlreadyStarted = 443875;
ResponseCodes.responsecodeLiveStreamAlreadyEnded = 443876;
ResponseCodes.responsecodeStreamIdMissing = 443877;

ResponseCodes.responsecodeInvalidBankId = 443880;
ResponseCodes.responsecodeInvalidAccountNumber = 443881;
ResponseCodes.responsecodeInvalidAccountTitle = 443882;
ResponseCodes.responsecodeBankAccountAlreadyExists = 443883;
ResponseCodes.responsecodeAccountTitleAlreadyExists = 443884;
ResponseCodes.responsecodeBankAccountValidationFailed = 443885;
ResponseCodes.responsecodeBankAccountNotFound = 443886;

ResponseCodes.responsecodeInvalidProductType = 443890;

ResponseCodes.responsecodeMissingUserIdsParam = 443891;
ResponseCodes.responsecodeInvalidUserIdsParam = 443892;
ResponseCodes.responsecodeInvalidObjectIdNew = 443893;
ResponseCodes.responsecodeMissingPhoneNumbersParam = 443894;
ResponseCodes.responsecodeInvalidPhoneNumbersParam = 443895;

ResponseCodes.responsecodeUserIsUnderage = 443900;
ResponseCodes.responsecodeIdApplicationNotFound = 443901;

ResponseCodes.responsecodeNoActiveLiveStreamFoundForUser = 443902;

ResponseCodes.responsecodeInvalidProvider = 443903;
ResponseCodes.responsecodeInvalidIdsArray = 443904;
ResponseCodes.responsecodeInvalidOperator = 443905;
ResponseCodes.responsecodeInvalidId = 443906;
ResponseCodes.responsecodeBlockAlreadyExists = 443907;
ResponseCodes.responsecodeBlockNotFound = 443908;

ResponseCodes.responsecodeIPCheckError = 443910;
ResponseCodes.responsecodeVPNDetected = 443911;
ResponseCodes.responsecodeUserWithUUIDAlreadyExists = 443912;

ResponseCodes.responsecodePhoneNumberIsTemporarilyBanned = 443913;

ResponseCodes.responsecodeProductMediaIsProcessing = 443914;
ResponseCodes.responsecodeProductMediaProcessingFailed = 443915;
ResponseCodes.responsecodeFileToDeleteInFileOrderString = 443916;
ResponseCodes.responsecodeFileToDeleteNotFound = 443917;
ResponseCodes.responsecodeFileToReorderNotFound = 443918;
ResponseCodes.responsecodeAddingAudioForExpoFailed = 443919;

ResponseCodes.responsecodeNoMessageIds = 443920;

ResponseCodes.responsecodeInvalidWatchTime = 443921;
ResponseCodes.responsecodeNoContentId = 443922;
ResponseCodes.responsecodeInvalidBonusType = 443923;
ResponseCodes.responsecodeContentTooShort = 443924;
ResponseCodes.responsecodeUnverifiedUserNotAllowedToUploadFiles = 443925;

ResponseCodes.responsecodeCreditsEngagementBonusLargerThanCreditBalance = 443926;

ResponseCodes.responsecodeInvalidTargetType = 443927;
ResponseCodes.responsecodeInvalidTargetId = 443928;
ResponseCodes.responsecodeUserIsBlockedFromCreatingLiveStreams = 443929;
ResponseCodes.responsecodeInvalidDuration = 443930;
ResponseCodes.responsecodeInvalidQuantity = 443931;
ResponseCodes.responsecodeInvalidBidIncrement = 443932;
ResponseCodes.responsecodeInvalidMinPrice = 443933;
ResponseCodes.responsecodeInvalidCounterBidTime = 443934;
ResponseCodes.responsecodeInvalidNote = 443935;
ResponseCodes.responsecodeNoShippingAddress = 443936;
ResponseCodes.responsecodeInvalidAuctionId = 443937;
ResponseCodes.responsecodeAuctionNotFound = 443938;
ResponseCodes.responsecodeOrderNotFound = 443940;
ResponseCodes.responsecodeInvalidOrderStatus = 443941;
ResponseCodes.responsecodeInvalidShippingInfo = 443942;
ResponseCodes.responsecodeAddressNotFound = 443950;

ResponseCodes.responsecodeCountryTemporarilyBanned = 444000;
ResponseCodes.responsecodeAppVersionTooOld = 444001;

// ResponseCodes.responsecodeNoAccessToken = 443897;

ResponseCodes.responsecodeUnauthorized = 5000001;

module.exports = Object.freeze(ResponseCodes);
