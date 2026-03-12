const { db } = require("#infra");
const mongoose = require("mongoose");
const { Config, Const } = require("#config");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    name: String,
    sortName: String,
    description: String,
    userid: String,
    password: String,
    created: Number,
    token: [],
    pushToken: [],
    webPushSubscription: [
      { endpoint: String, expiration: mongoose.Schema.Types.Mixed, keys: {}, created: Number },
    ],
    voipPushToken: [],
    organizationId: String,
    status: Number, // 1: Enabled, 0: Disabled
    avatar: {
      picture: {
        originalName: String,
        size: Number,
        mimeType: String,
        nameOnServer: String,
        link: String,
      },
      thumbnail: {
        originalName: String,
        size: Number,
        mimeType: String,
        nameOnServer: String,
        link: String,
      },
    },
    groups: [String],
    permission: Number, // 1: user (za web client), 2: organizationAdmin, 3: subAdmin, 4: flom agent,
    isGuest: Number,
    muted: [],
    blocked: [],
    devices: [],
    UUID: [],
    phoneNumber: String,
    activationCode: String,
    flow: {
      typeAcc: Number,
      merchantCode: String,
      bankAccountName: String,
      bankAccountNumber: String,
      bankAccountCode: String,
      merchantDOB: String,
    },
    merchantDOB: String,
    typeAcc: Number, // 1 - merchant, 2 - customer
    bankAccounts: [
      {
        name: String,
        accountNumber: String,
        code: String,
        merchantCode: String,
        bankName: String,
        businessName: String,
        selected: Boolean,
        lightningUserName: String,
        lightningAddress: String,
        lightningUrlEncoded: String,
        _id: false,
      },
    ],
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] },
    },
    address: {
      country: String,
      countryCode: String,
      city: String,
      road: String,
      houseNumber: String,
      postCode: String,
      displayName: String,
    },
    shippingAddresses: [
      {
        name: String,
        country: String,
        countryCode: String,
        region: String,
        regionCode: String,
        city: String,
        road: String,
        houseNumber: String,
        postCode: String,
        isDefault: Boolean,
      },
    ],
    aboutBusiness: String,
    categoryBusinessId: String,
    businessCategory: { _id: String, name: String },
    workingHours: { start: String, end: String },
    isAppUser: { type: Boolean, default: true },
    flomAgentId: { type: String, default: null },
    newUserNotificationSent: { type: Boolean, default: false },
    followedBusinesses: [String],
    likedProducts: [String],
    likedLiveStreams: [String],
    recentlyViewedProducts: [String],
    userName: String,
    invitationUri: String,
    ref: String,
    createdBusinessInFlom: { type: Boolean, default: false },
    onAnotherDevice: { type: Boolean, default: false },
    shadow: { type: Boolean, default: false },
    paymentProfileId: String,
    email: String,
    isDeleted: {
      value: { type: Boolean, default: false },
      created: { type: Number, default: Date.now },
    },
    featured: {
      types: { type: [Number], default: [] },
      countryCode: { type: String, default: "default" },
    },
    blockedProducts: { type: Number, default: 0 }, // 0 - unblocked, 1 - blocked
    cover: {},
    /* cover can have audio, banner and video. Example:
      video: {
        file: {
          originalName: String,
          nameOnServer: String,
          aspectRatio: Number,
          duration: Number,
          mimeType: String,
          size: Number,
          hslName: String,
        },
        thumb: {
          originalName: String,
          nameOnServer: String,countryCode
          mimeType: String,
          size: Number,
        },
        fileType: Number, // 0 - image/banner, 1 - video, 2 - audio
      }, */
    memberships: [], // { id: "6141cdb09c2112769234376d", expirationDate: 1590000125608 }
    socialMedia: [],
    socialMediaLinks: [],
    isCreator: { type: Boolean, default: false },
    isSeller: { type: Boolean, default: false },
    notifications: {
      timestamp: { type: Number, default: 0 },
      unreadCount: { type: Number, default: 0 },
    },
    phoneNumberStatus: { type: Number, default: Const.phoneNumberUntested },
    payoutFrequency: { type: Number, default: Const.payoutFrequencyNever },
    paypalEmail: String,
    lastPayoutDate: { type: Number, default: 0 },
    merchantApplicationStatus: { type: Number, default: null },
    internationalUser: Boolean,
    locationVisibility: { type: Boolean, required: true, default: false },
    creditBalance: { type: Number, default: 0 },
    deletedUserInfo: {
      phoneNumber: String,
      userName: String,
      name: String,
      bankAccounts: [
        {
          name: String,
          accountNumber: String,
          code: String,
          merchantCode: String,
          bankName: String,
          businessName: String,
          selected: Boolean,
          _id: false,
        },
      ],
    },
    countryCode: String,
    currency: String,
    stateCode: String,
    zipCode: String,
    emailActivation: {
      isVerified: { type: Boolean, default: false },
      code: String,
      timestamp: Number,
    },
    deviceType: String,
    dateOfBirth: Number,
    kidsMode: { type: Boolean, default: false },
    satsBalance: { type: Number, default: 0 },
    lightningUserName: String,
    lightningUrlEncoded: String,
    hasLoggedIn: { type: Number, default: Const.userNeverLoggedIn }, // 1 - logged in at least once, 2 - never logged in, 3 - old user, 4 - shadow user
    hasChangedLnUserName: { type: Boolean, default: false },
    modified: { type: Number, default: Date.now },
    firstLogin: Number,
    lastLogin: Number,
    loginCount: { type: Number, default: 0 },
    isSupportUser: Boolean,
    activeLiveStream: { _id: String, name: String, type: { type: String } },
    nigerianBankAccounts: [
      {
        title: String,
        ownerName: String,
        accountNumber: String,
        bankId: String,
        bankCode: String,
        logoFileName: String,
        bankName: String,
      },
    ],
    identityStatus: { type: Number, default: 1 }, // 1 - default, 2 - verification needed, 3 - verified, 4 - invalid
    androidVersionCode: Number,
    androidVersionName: String,
    iosVersionCode: Number,
    iosVersionName: String,
    bankAccountsLastUpdated: { type: Number, default: 1 },
    lastActive: { type: Number, default: Date.now },
    flomTeamThreadId: String,
    deviceLanguage: String,
    visitingStreak: [Number],
    ratingAttempted: { type: Boolean, default: false },
    bonusPaymentMethod: { type: String, default: "credits" },
    payoutLimit: Number,
    blockedFromCreatingLiveStreams: { type: Boolean, default: false },
    auctionPaymentMethod: String,
    auctionPaymentMethodLocked: { type: Boolean, default: false },
    bannedFromAuctions: { type: Boolean, default: false },
    satsBalanceReserve: [{ reserveType: String, auctionId: String, value: Number }],
    timeZone: String,
    shippingOptions: { shippingInterval: Number },
  },
  { timestamps: true },
);

schema.index({ location: "2dsphere", created: -1 });

schema.index(
  { name: "text", description: "text", aboutBusiness: "text", "businessCategory.name": "text" },
  { name: "flomUserSearch" },
);

schema.index({ featured: 1, isDeleted: 1 });

schema.index({ followedBusinesses: -1 });

schema.index({ likedProducts: -1 });

schema.index({ memberships: -1 });

schema.index({ phoneNumber: 1 }, { unique: true });

schema.post("findOne", function (docs) {
  // Modify each document in the result
  if (docs?.nigerianBankAccounts && docs?.nigerianBankAccounts.length > 0) {
    docs.nigerianBankAccounts.forEach((bankAccount) => {
      if (bankAccount.logoFileName && bankAccount.logoFileName.length > 0) {
        // Construct logoUrl based on logoFileName
        if (bankAccount._doc)
          bankAccount._doc.logoUrl = `${Config.webClientUrl}/api/v2/payment-methods/get-logo/${bankAccount.logoFileName}`;
        else if (bankAccount)
          bankAccount.logoUrl = `${Config.webClientUrl}/api/v2/payment-methods/get-logo/${bankAccount.logoFileName}`;
      } else {
        // Provide a default logoUrl if logoFileName is not present
        if (bankAccount._doc)
          bankAccount._doc.logoUrl = `${Config.webClientUrl}/api/v2/payment-methods/get-logo/default-image.png`;
        else if (bankAccount)
          bankAccount.logoUrl = `${Config.webClientUrl}/api/v2/payment-methods/get-logo/default-image.png`;
      }
      // Remove logoFileName from the document
      if (bankAccount._doc) delete bankAccount._doc.logoFileName;
      else if (bankAccount) delete bankAccount.logoFileName;
    });
  }

  if (docs && docs.dateOfBirth) {
    docs.dateOfBirth = Math.round(docs.dateOfBirth);
  }

  if (docs && docs.satsBalanceReserve && docs.satsBalanceReserve.length > 0) {
    let totalReserved = 0;
    docs.satsBalanceReserve.forEach((reserve) => {
      totalReserved += reserve.value;
    });
    docs.satsBalance = docs.satsBalance - totalReserved;
  }

  return docs;
});

schema.post("find", function (docs) {
  // Modify each document in the result
  docs.forEach((user) => {
    if (user.nigerianBankAccounts && user.nigerianBankAccounts.length > 0) {
      user.nigerianBankAccounts.forEach((bankAccount) => {
        // console.log("bankAccount", bankAccount);
        if (bankAccount.logoFileName && bankAccount.logoFileName.length > 0) {
          // Construct logoUrl based on logoFileName
          if (bankAccount._doc)
            bankAccount._doc.logoUrl = `${Config.webClientUrl}/api/v2/payment-methods/get-logo/${bankAccount.logoFileName}`;
          else if (bankAccount)
            bankAccount.logoUrl = `${Config.webClientUrl}/api/v2/payment-methods/get-logo/${bankAccount.logoFileName}`;
        } else {
          // Provide a default logoUrl if logoFileName is not present
          if (bankAccount._doc)
            bankAccount._doc.logoUrl = `${Config.webClientUrl}/api/v2/payment-methods/get-logo/default-image.png`;
          else if (bankAccount)
            bankAccount.logoUrl = `${Config.webClientUrl}/api/v2/payment-methods/get-logo/default-image.png`;
        }
        // Remove logoFileName from the document
        if (bankAccount._doc) delete bankAccount._doc.logoFileName;
        else if (bankAccount) delete bankAccount.logoFileName;
      });
    }

    if (user && user.dateOfBirth) {
      user.dateOfBirth = Math.round(user.dateOfBirth);
    }

    if (user && user.satsBalanceReserve && user.satsBalanceReserve.length > 0) {
      let totalReserved = 0;
      user.satsBalanceReserve.forEach((reserve) => {
        totalReserved += reserve.value;
      });
      user.satsBalance = user.satsBalance - totalReserved;
    }
  });
  return docs;
});

schema.statics.getDefaultResponseFields = function () {
  return {
    _id: true,
    description: true,
    name: true,
    organizationId: true,
    userid: true,
    avatar: true,
    phoneNumber: true,
    bankAccounts: true,
    created: true,
  };
};

schema.statics.getAvatar = ({ avatar }) => {
  const formattedAvatar = {
    picture: {},
    thumbnail: {},
  };

  if (avatar && avatar.picture && avatar.picture.nameOnServer) {
    formattedAvatar.picture = {
      ...avatar.picture,
      ...(!avatar.picture.link && {
        link: `${Config.webClientUrl}/api/v2/avatar/user/${avatar.picture.nameOnServer}`,
      }),
    };
  }

  if (avatar && avatar.thumbnail && avatar.thumbnail.nameOnServer) {
    formattedAvatar.thumbnail = {
      ...avatar.thumbnail,
      ...(!avatar.thumbnail.link && {
        link: `${Config.webClientUrl}/api/v2/avatar/user/${avatar.thumbnail.nameOnServer}`,
      }),
    };
  }

  return formattedAvatar;
};

module.exports = db.db1.model("User", schema, "users");
