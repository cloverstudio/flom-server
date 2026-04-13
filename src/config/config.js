const getPaths = require("./dir-config");

const environment = process.env.NODE_ENV === "local" ? "development" : process.env.NODE_ENV;
const paths = getPaths(environment);

const Config = { ...paths };

Config.environment = environment;
Config.host = "localhost";
Config.serverType = process.env.SERVER_TYPE || "api";
Config.port = { api: process.env.API_PORT || 8084, socket: process.env.SOCKET_PORT || 8085 };
Config.useSSL = false;

Config.preSelfRegistrationPostUrl = process.env.preSelfRegistrationPostUrl;
Config.selfRegistrationPostUrl = process.env.selfRegistrationPostUrl;
Config.getMerchantCodeUrl = process.env.getMerchantCodeUrl;
Config.paymentWithAccountPostUrl = process.env.paymentWithAccountPostUrl;
Config.paymentPostUrl = process.env.paymentPostUrl;
Config.prepaymentPostUrl = process.env.prepaymentPostUrl;
Config.airtimeRechargeUrl = process.env.airtimeRechargeUrl;
Config.airtimeDataRechargeUrl = process.env.airtimeDataRechargeUrl;
Config.airtimeDataRechargeStatusUrl = process.env.airtimeDataRechargeStatusUrl;
Config.dataProductsUrl = process.env.dataProductsUrl;
Config.airtimeMTNDataProductsUrl = process.env.airtimeMTNDataProductsUrl;
Config.transactionDetailUrl = process.env.transactionDetailUrl;
Config.GetAllBankAccountsWithMsisdn = process.env.GetAllBankAccountsWithMsisdn;
Config.simpleUSSDPushBaseURL = process.env.simpleUSSDPushBaseURL;
Config.baseSmsLinkSolano = process.env.baseSmsLinkSolano;
Config.getCustomersDetailsUrl = process.env.getCustomersDetailsUrl;
Config.paymentAndAcquisition = process.env.paymentAndAcquisition;
Config.getMerchantPhoneNumberUrl = process.env.getMerchantPhoneNumberUrl;
Config.ussdPushQrios = process.env.ussdPushQrios;
Config.mysqlMCashHost = process.env.mysqlMCashHost;

Config.cookieConfig = {
  httpOnly: true, // to disable accessing cookie via client side js
  secure: true, // to force https (if you use it)
  sameSite: "Strict",
  domain: Config.environment !== "production" ? ".flom.dev" : ".flom.app",
  expires: new Date(2147483647000), // Maximum Unix epoch time
  path: "/",
};

Config.dbCollectionPrefix = "";
Config.databaseUrl = process.env.FLOM_DB_URL;
Config.newFlomDatabaseUrl = process.env.NEW_FLOM_DB_URL;

Config.forceLogoutAllDevice = false;

Config.redis = {
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
};
Config.pushServiceUrl = process.env.PUSH_URL;
Config.smsServiceUrl = process.env.SMS_URL;
Config.batchSMSServiceUrl = process.env.BATCH_SMS_URL;
Config.smsServiceToken = process.env.SMS_TOKEN;

Config.paypalAccessToken = process.env.PAYPAL_ACCESS_TOKEN;

Config.transactionSupportEmail = process.env.TRANSACTION_SUPPORT_EMAIL;
Config.airtimeSupportEmail = process.env.AIRTIME_SUPPORT_EMAIL;
Config.loginSupportEmail = process.env.LOGIN_SUPPORT_EMAIL;
Config.flomTeamSupportEmail = process.env.FLOM_TEAM_SUPPORT_EMAIL;
Config.supportEmail = "petarb.flom@gmail.com";
Config.blockedNumberEmail = process.env.BLOCKED_NUMBER_EMAIL;

Config.sendUSSDNewUserNotifications = !!+process.env.SEND_USSD_NEW_USER_NOTIFICATION;
Config.sendSMSNewUserNotifications = !!+process.env.SEND_SMS_NEW_USER_NOTIFICATION;
Config.sendActivationCode = !!+process.env.SEND_ACTIVATION_CODE;

Config.webClientUrl = process.env.WEB_CLIENT_URL;
Config.devWebClientUrl = "https://v1.flom.dev";
Config.adminPageUrl = process.env.ADMIN_PAGE_URL;

Config.flomSupportAgentId = process.env.SUPPORT_AGENT_ID;
Config.flomSettlementAgentId = process.env.SETTLEMENT_AGENT_ID;

Config.authorizeApiLoginId = process.env.AUTHORIZE_LOGIN_ID;
Config.authorizeTransactionKey = process.env.AUTHORIZE_TRANSACTION_KEY;

Config.reCaptchaSecret = process.env.RECAPTCHA_SECRET;
Config.newReCaptchaSecret = process.env.NEW_RECAPTCHA_SECRET;
Config.reCaptchaURL = process.env.RECAPTCHA_URL;

Config.groupCallBaseUrl = process.env.GROUP_CALL_URL;

Config.directionsBaseUrl = process.env.DIRECTIONS_API_BASE_URL;
Config.directionsApiKey = process.env.DIRECTIONS_API_KEY;

Config.paymentServiceBaseUrl = process.env.PAYMENT_SERVICE_URL;

Config.proIPApiKey = process.env.PRO_IP_API_KEY;

Config.AESPassword = process.env.AES_PASSWORD;
Config.hashSalt = process.env.HASH_SALT;
Config.hackSalt = process.env.HACK_SALT;
Config.username = process.env.ADMIN_USERNAME;
Config.password = process.env.ADMIN_PASWORD;

Config.socketNameSpace = "/flom";
Config.socketAuctionsNameSpace = "/auctions";
Config.defaultAvatar = "/img/noname.png";
Config.defaultAvatarGroup = "/img/noname-group.png";

Config.signinBackDoorSecret = "";

Config.webRTCConfig = {
  isDev: true,
  socketNameSpace: "signaling",
  server: {
    port: Config.port,
    secure: false,
    key: null,
    cert: null,
    password: null,
  },
  peerConnectionConfig: {
    iceTransports: "relay",
  },
  rooms: {
    maxClients: 0,
  },

  /*
	stunservers: [
		{
			url: "stun:coturn.flom.co:3478",
		},
	],
	*/

  stunservers: [
    {
      url: "stun:stun.relay.metered.ca:80",
    },
  ],

  /*
	stunservers: [
		{
			url: "stun:stun.l.google.com:19302",
		},
	],
	*/
  /*
	turnservers: [
		{
			urls: ["turn:coturn.flom.co"],
			secret: "cloverlover",
			expiry: 86400,
			user: "1594220477",
			password: "f+/dddF0wuxbaxwNyqWpRsK4d6E=",
		},
	],
	*/
  turnservers: [
    {
      urls: [
        "turn:a.relay.metered.ca:80",
        "turn:a.relay.metered.ca:80?transport=tcp",
        "turn:a.relay.metered.ca:443",
        "turn:a.relay.metered.ca:443?transport=tcp",
      ],
      secret: process.env.METERED_SECRET,
      expiry: 86400,
      user: process.env.METERED_USER,
      password: process.env.METERED_PASS,
    },
  ],
};

Config.email = {
  service: "",
  username: "",
  password: "",
  from: "no-reply@clover-studio.com",
};

Config.smtp = {
  host: "",
  port: 25,
  username: "",
  password: "",
};

Config.protocol = "http://";

Config.twilio = {
  accountSid: process.env.TWILIO_ACCOUNT_SID,
  authToken: process.env.TWILIO_AUTH_TOKEN,
  fromNumber: process.env.TWILIO_FROM_NUMBER,
  fromNumbers: process.env.TWILIO_FROM_NUMBERS?.split(","),
  authorization: `Basic ${process.env.TWILIO_AUTH_HEADER}`,
};

Config.numLookupApiKey = process.env.NUMLOOKUP_API_KEY;
Config.sendgridAPIKey = process.env.SENDGRID_API_KEY;

Config.useVoipPush = !!+process.env.USE_VOIP_PUSH;
Config.useCluster = !!+process.env.USE_CLUSTER;
Config.phoneNumberSignin = !!+process.env.PHONENUMBER_SIGNIN;

Config.robotUserId = process.env.ROBOT_USER_ID;

Config.featuredProductsIds = [];

Config.dynamicLink = {
  webAPIKey: process.env.DYNAMIC_LINK_WEB_API_KEY,
  webAPIUrl: process.env.DYNAMIC_LINK_WEB_API_URL,
  baseLink: process.env.DYNAMIC_LINK_BASE_URL,
  apn: process.env.DYNAMIC_LINK_APN,
  ibi: process.env.DYNAMIC_LINK_IBI,
  isi: process.env.DYNAMIC_LINK_ISI,
  st: "Join me at Flom Messenger!",
  sd: "Send top-up minutes and data to those you care about. Call and text for free with flom",
  si: "https://flom.app/img/common/mobile_phones_stacked_element.png",
};

Config.qriosHeaders = {
  "Content-Type": "application/json",
  "X-Client-Id": process.env.QRIOS_CLIENT_ID,
  "X-Client-Secret": process.env.QRIOS_CLIENT_SECRET,
};
Config.ppnHeaders = {
  "Content-Type": "application/json",
  Authorization: `Basic ${process.env.PPN_TOKEN}`,
};

Config.campaignOn = true;
Config.amountToGive = 4500000;
Config.expireTimeForQRCode = 60 * 1000;
Config.expireTimeForSMSCode = 60 * 1000;
Config.expireTimeForEmail = 10 * 60 * 1000;
Config.usernameProtectionPeriod = 10 * 60 * 1000;

Config.adminPageRegistrationToken = process.env.ADMIN_PAGE_REGISTRATION_TOKEN;
Config.saltRounds = 10;

Config.creatorMembershipsMaxCount = 3;

Config.conversionRateAPIKey = process.env.CONVERSION_RATES_API_KEY;
Config.getConversionRatesURL = process.env.CONVERSION_RATES_API_URL;
Config.getConversionRatesURLProd = process.env.CONVERSION_RATES_API_URL_PROD;

Config.supportCategories = [
  {
    label: "Transaction issue",
    selector: "transactions",
    pickerTitle: "Select transaction",
    type: "transaction_issue",
    token: true,
  },
  {
    label: "Payout issue",
    selector: "payouts",
    pickerTitle: "Select payout",
    type: "payout_issue",
    token: true,
  },
  {
    label: "Report abuse",
    selector: "abuse",
    pickerTitle: "Select contact",
    type: "report_abuse",
    token: true,
  },
  { label: "Problem with login", selector: "login", type: "login_issue", token: false },
  { label: "Registration problem", selector: "login", type: "login_issue", token: false },
  { label: "Something else", selector: null, type: "other", token: false },
  { label: "Report content", selector: "content", type: "content", token: true },
  {
    label: "International user",
    selector: "international_user",
    type: "international_user",
    token: true,
  },
  {
    label: "Live stream",
    selector: "live_stream",
    pickerTitle: "Select live stream",
    type: "live_stream",
    token: true,
  },
  {
    label: "Refund request",
    selector: "refund_request",
    type: "refund_request",
    token: true,
  },
  {
    label: "Content comment",
    selector: "content_comment",
    type: "content_comment",
    token: true,
  },
  {
    label: "Bug report",
    selector: "bug_report",
    type: "bug_report",
    token: true,
  },
  {
    label: "Auction issue",
    selector: "auctions",
    pickerTitle: "Select auction",
    type: "auction_issue",
    token: true,
  },
  {
    label: "Content issue",
    selector: "content_issue",
    type: "content_issue",
    token: true,
  },
  {
    label: "Order cancellation request",
    selector: "order_cancellation_request",
    type: "order_cancellation_request",
    token: true,
  },
  {
    label: "Order issue",
    selector: "order_issue",
    type: "order_issue",
    token: true,
  },
];

Config.defaultLoginSupportType = "login_issue";
Config.defaultAbuseSupportType = "report_abuse";
Config.defaultTransferSupportType = "transaction_issue";
Config.defaultContentSupportType = "content";
Config.supportTypes = [
  "login_issue",
  "transaction_issue",
  "payout_issue",
  "report_abuse",
  "other",
  "content",
  "feedback",
  "international_user",
  "live_stream",
  "refund_request",
  "content_comment",
  "bug_report",
  "flom_team_support",
  "auction_issue",
  "content_issue",
  "order_cancellation_request",
  "order_issue",
];

Config.syncStrings = {
  topUpEnabled: "Top up transfers are supported to this contact’s country",
  dataEnabled: "Data transfers are supported to this contact's country",
  allDisabled:
    "Gifting is not available for this contact’s country. Check to be sure the country code (e.g. +53, +268, etc.) is correct.",
};

Config.binLookupCacheLifetime = 90 * 24 * 60 * 60 * 1000; // 90 days in milliseconds

Config.addressAutocompleteApiUrl = process.env.ADDRESS_AUTOCOMPLETE_API_URL;
Config.addressAutocompleteApiKey = process.env.ADDRESS_AUTOCOMPLETE_API_KEY;

Config.chatGPTApiKey = process.env.CHAT_GPT_API_KEY;

Config.ipCheckUrl = process.env.PROXYCHECK_URL;
Config.ipCheckApiKey = process.env.PROXYCHECK_API_KEY;

Config.sessionkey = process.env.SESSION_KEY;
Config.sessionsalt = process.env.SESSION_SALT;

Config.appStoreLink = process.env.APP_STORE_LINK;

Config.infobipUrl = process.env.INFOBIP_URL;
Config.infobipAuthorization = process.env.INFOBIP_AUTH;

Config.guestToken = process.env.GUEST_TOKEN;

Config.taxApiUrlCanada = process.env.TAX_API_URL_CAN;
Config.taxApiUrlUsa = process.env.TAX_API_URL_USA;
Config.taxApiKey = process.env.TAX_API_KEY;

Config.antMediaBaseUrl = process.env.ANTMEDIA_BASE_URL;

Config.testSnippet = process.env.TEST_SNIPPET;

Config.runScheduler = !!+process.env.RUN_SCHEDULER;

Config.rabbitMQUrl = "amqp://localhost";

Config.binCheckerUrl = "https://bin-ip-checker.p.rapidapi.com?ip=8.8.8.8&bin=";
Config.binCheckerHeaders = {
  "x-rapidapi-host": "bin-ip-checker.p.rapidapi.com",
  "x-rapidapi-key": process.env.BINCHECKER_APIKEY,
};

Config.recombee = {
  dbId: process.env.RECOMBEE_DB_ID,
  privateToken: process.env.RECOMBEE_PRIVATE_TOKEN,
  region: process.env.RECOMBEE_REGION,
};

Config.instance = process.env.NODE_APP_INSTANCE;

Config.whatsAppAccessToken = process.env.WA_ACCESS_TOKEN;
Config.whatsAppPhoneNumberId = process.env.WA_PHONE_NUMBER_ID;
Config.whatsAppDevPhoneNumberId = process.env.WA_DEV_PHONE_NUMBER_ID;

module.exports = Object.freeze(Config);
