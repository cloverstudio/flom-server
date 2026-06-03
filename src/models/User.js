const { db, logger } = require("#infra");
const mongoose = require("mongoose");
const { Config, Const } = require("#config");
const Utils = require("#utils");

const Membership = require("./Membership");
const Tribe = require("./Tribe");
const ConversionRate = require("./ConversionRate");

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
    flomSupportAgentId: { type: String, default: null },
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
    failedAuctionPayments: { type: Number, default: 0 },
    bannedFromAuctionsUntil: { type: Number, default: 0 },
    timeZone: String,
    shippingOptions: { shippingInterval: Number },

    whatsApp: {
      reference: String,
      windowExpiresAt: { type: Number, default: 0 },
      followupMessageSent: { type: Boolean, default: false },
      receivedUnknownRecipientNotice: { type: Boolean, default: false },
      businessPhoneNumber: String,
      businessConnected: { type: Boolean, default: false },
    },

    notificationOptions: {
      whatsApp: {
        enabled: { type: Boolean, default: false },
        enabledIntended: { type: Boolean, default: false }, // track if user has ever tried to change whatsapp notification settings
        goLive: { type: Boolean, default: false },
        pendingPayment: { type: Boolean, default: false },
        shippingUpdate: { type: Boolean, default: false },
        secondChance: { type: Boolean, default: false },
        newDrop: { type: Boolean, default: false },
        auctionReminder: { type: Boolean, default: false },
        bookingConfirmation: { type: Boolean, default: false },
        bookingReminder: { type: Boolean, default: false },
      },
      push: {
        enabled: { type: Boolean, default: true },
        enabledIntended: { type: Boolean, default: true },
      },
      email: {
        enabled: { type: Boolean, default: true },
        enabledIntended: { type: Boolean, default: true },
      },
      sms: {
        enabled: { type: Boolean, default: false },
        enabledIntended: { type: Boolean, default: false },
      },
    },

    notificationSubscriptions: [{ userId: String, whatsApp: Boolean, push: Boolean, _id: false }],
    slug: String,
    oldSlug: String,
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
  });
  return docs;
});

const User = db.db1.model("User", schema, "users");

class ExtendedUser extends User {
  static getDefaultResponseFields() {
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
      whatsApp: true,
      slug: true,
    };
  }

  static getAvatar({ avatar }) {
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
  }

  static filterExpiredMemberships(userMemberships) {
    if (!userMemberships) return [];
    const timeNow = Date.now();
    return userMemberships.filter(
      (membership) => membership.expirationDate === -1 || membership.expirationDate > timeNow,
    );
  }

  static async generateFakeMerchantCode() {
    let merchantCode,
      finished = false;
    do {
      merchantCode = Utils.generateRandomNumber(8).toString();
      const exists = await this.findOne(
        { "bankAccounts.merchantCode": merchantCode },
        { _id: 1 },
      ).lean();
      if (!exists) {
        finished = true;
      }
    } while (!finished);
    return merchantCode;
  }

  static generateSocialMediaWithLinks({ socialMedia }) {
    let socMediaArray = [];

    if (socialMedia && socialMedia.length) {
      const linkTemplate = Const.socialMediaLinkTemplate;
      for (let i = 0; i < socialMedia.length; i++) {
        if (!socialMedia[i]) continue;

        const links = linkTemplate[socialMedia[i]?.type];
        const username = socialMedia[i]?.username;
        if (links && username) {
          if (links.profileWebUrl) {
            socialMedia[i].profileWebUrl = links.profileWebUrl.replace("{username}", username);
          }
          if (links.profileIOSUrl) {
            socialMedia[i].profileIOSUrl = links.profileIOSUrl.replace("{username}", username);
          }
          if (links.profileAndroidUrl) {
            socialMedia[i].profileAndroidUrl = links.profileAndroidUrl.replace(
              "{username}",
              username,
            );
          }
        }

        socMediaArray.push(socialMedia[i]);
      }
    }
    return socMediaArray;
  }

  static async isUserCommunityMember({ productCommunityIds, userId }) {
    try {
      const user = await this.findOne({ _id: userId }).lean();

      if (!productCommunityIds || productCommunityIds.length < 1) {
        return false;
      }
      const filteredCommunityIds = productCommunityIds.filter((id) => id !== "");
      const productCommunities = await Membership.find({
        _id: { $in: filteredCommunityIds },
      }).lean();
      if (!productCommunities || productCommunities.length === 0) return false;
      for (let i = 0; i < productCommunities.length; i++) {
        if (userId === productCommunities[i].creatorId) {
          return true;
        }
      }
      for (let j = 0; j < filteredCommunityIds.length; j++) {
        for (let k = 0; k < user.memberships.length; k++) {
          if (user.memberships[k].id === filteredCommunityIds[j]) return true;
        }
      }

      return false;
    } catch (error) {
      console.error("isUserCommunityMember error: ", error);
      throw error;
    }
  }

  static async isUserTribeMember({ productTribeIds, userId }) {
    try {
      if (!productTribeIds || productTribeIds.length < 1) {
        return false;
      }
      const filteredTribeIds = productTribeIds.filter((id) => id !== "");
      const productTribes = await Tribe.find({ _id: { $in: filteredTribeIds } }).lean();
      if (!productTribes || productTribes.length === 0) return false;
      for (let i = 0; i < productTribes.length; i++) {
        if (userId === productTribes[i].ownerId) {
          return true;
        }
        for (let j = 0; j < productTribes[i].members.accepted.length; j++) {
          if (userId === productTribes[i].members.accepted[j].id) return true;
        }
      }
      return false;
    } catch (error) {
      console.error("isUserTribeMember error: ", error);
      throw error;
    }
  }

  static async getUsersConversionRate({ user, accessToken }) {
    if (!user) {
      if (!accessToken || accessToken.length !== Const.tokenLength)
        return { userRate: null, userCountryCode: null, userCurrency: null, conversionRates: null };

      user = await this.findOne({ "token.token": accessToken }).lean();
      if (!user)
        return { userRate: null, userCountryCode: null, userCurrency: null, conversionRates: null };
    }

    const userCountryCode =
      user.countryCode || Utils.getCountryCodeFromPhoneNumber({ phoneNumber: user.phoneNumber });
    const conversionRates = await ConversionRate.getRates();
    const userCurrency = Utils.getCurrencyFromCountryCode({
      countryCode: userCountryCode,
      rates: conversionRates.rates,
    });
    const userRate = conversionRates.rates[userCurrency];

    return { userRate, userCountryCode, userCurrency, conversionRates };
  }

  static async createSlug(user) {
    try {
      if (!user || !user.userName) throw new Error("User name is required to create slug");

      let slug = Utils.slugify({ text: user.userName, separator: "_" });

      if (!slug) {
        slug = user._id.toString().slice(0, 8);
      }

      if (slug.length > 30) {
        slug = slug.slice(0, 30);
      }

      let exists = true;
      let finalSlug = slug;

      while (exists) {
        const existingUser = await this.findOne({ slug: finalSlug });
        if (existingUser) {
          finalSlug = `${slug}${Utils.generateRandomNumber(2)}`;
        } else {
          exists = false;
        }
      }

      return finalSlug;
    } catch (error) {
      logger.error("user createSlug error: ", error);
      return null;
    }
  }
}

module.exports = ExtendedUser;
