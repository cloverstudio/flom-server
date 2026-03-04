"use strict";

const { Config, Const } = require("#config");
const Utils = require("#utils");
const {
  LiveStream,
  Membership,
  Tribe,
  Product,
  User,
  Group,
  Organization,
  Transfer,
} = require("#models");
const getUsersOnlineStatus = require("./getUsersOnlineStatus");

async function formatUserDetailsResponse({ user, requestAccessToken = "" }) {
  const userId = user._id.toString();

  let groupsLimited = user.groups;

  if (Array.isArray(groupsLimited)) {
    groupsLimited = groupsLimited.slice(0, 20);

    groupsLimited = groupsLimited.map(function (item) {
      return item.toString();
    });

    user.groupModels = await Group.find({ _id: { $in: groupsLimited } }).lean();
  }

  // get online status
  user.organization = await Organization.findOne(
    { _id: user.organizationId },
    {
      organizationId: 1,
      name: 1,
    },
  ).lean();

  // get online status
  const status = await getUsersOnlineStatus([userId]);
  user.onlineStatus = !status ? 0 : status[0].onlineStatus;

  const updatedUser = {};

  if (!user.isCreator) {
    const userContentCount = await Product.countDocuments({
      ownerId: userId,
      type: Const.productTypeVideo,
      isDeleted: false,
    });

    if (userContentCount > 0) {
      user.isCreator = true;
      updatedUser.isCreator = true;
    } else if (user.isCreator === undefined) {
      user.isCreator = false;
      updatedUser.isCreator = false;
    }
  }

  let userSoldProductsCount = 0;
  const userProducts = await Product.find(
    {
      ownerId: userId,
      type: Const.productTypeProduct,
      isDeleted: false,
    },
    { _id: 1 },
  ).lean();
  user.productsCount = userProducts.length;

  if (userProducts.length > 0) {
    if (!user.isSeller) {
      user.isSeller = true;
      updatedUser.isSeller = true;
    }

    const marketplaceTransfers = await Transfer.find({
      receiverPhoneNumber: user.phoneNumber,
      status: Const.transferComplete,
      transferType: Const.transferTypeMarketplace,
    });
    marketplaceTransfers.forEach((transfer) => {
      for (const item of transfer.basket) {
        userSoldProductsCount += item.quantity;
      }
    });
  } else if (user.isSeller === undefined) {
    user.isSeller = false;
    updatedUser.isSeller = false;
  }

  if (!user.cover || !user.cover.banner) {
    user.cover = { ...user.cover, banner: Const.defaultProfileBanner };
    updatedUser.cover = user.cover;
  }

  let lightningUserName;
  const regexTerminalCode = /[^0-9]/g;
  if (!user.lightningUserName) {
    let stringExists = false;

    do {
      const randomString = Utils.getRandomString(8).toLowerCase();

      const lnRegex = new RegExp(`^${randomString}$`, "i");
      const alreadyExists = await User.findOne({
        $or: [{ lightningUserName: lnRegex }, { userName: lnRegex }],
      }).lean();
      if (alreadyExists) {
        stringExists = true;
      } else if (!randomString.match(regexTerminalCode)) {
        stringExists = true;
      } else {
        updatedUser.lightningUserName = randomString;
        lightningUserName = randomString;
        stringExists = false;
      }
    } while (stringExists);
  } else if (/[A-Z]/.test(user.lightningUserName)) {
    user.lightningUserName = user.lightningUserName.toLowerCase();
    lightningUserName = user.lightningUserName;
  } else {
    lightningUserName = user.lightningUserName;
  }

  const baseUrl = Config.environment === "production" ? "flom.app" : "flom.dev";

  const lightningAddress = `${lightningUserName}@${baseUrl}`;
  const lnurl = `https://${baseUrl}/.well-known/lnurlp/${lightningUserName}`;
  const lightningUrlEncoded = Utils.encodeLnUrl(lnurl);

  if (
    user.bankAccounts &&
    user.bankAccounts.length > 0 &&
    !user.bankAccounts[0].lightningUserName
  ) {
    user.bankAccounts.forEach((account) => {
      account.lightningUserName = account.merchantCode;
      account.lightningAddress = `${account.lightningUserName}@${baseUrl}`;
      const lnUrl = `https://${baseUrl}/.well-known/lnurlp/${account.lightningUserName}`;
      account.lightningUrlEncoded = Utils.encodeLnUrl(lnUrl);
    });

    updatedUser.bankAccounts = user.bankAccounts;
  }

  delete user.lightningRequestTags;
  user.lightningAddress = lightningAddress;
  user.lightningUrlEncoded = lightningUrlEncoded;
  updatedUser.lightningUserName = lightningUserName;
  updatedUser.lightningUrlEncoded = lightningUrlEncoded;

  await User.updateOne({ _id: user._id }, { $set: { ...updatedUser } });
  user.soldProductsCount = userSoldProductsCount;

  user.subscribersCount = await User.countDocuments({ followedBusinesses: userId });

  const creatorMemberships = await Membership.find({ creatorId: userId, deleted: false })
    .sort({ order: 1 })
    .lean();
  user.creatorMemberships = creatorMemberships;

  const creatorMembershipIds = creatorMemberships.map((membership) => membership._id.toString());
  user.membersCount = await User.countDocuments({
    "memberships.id": { $in: creatorMembershipIds },
  });

  user.socialMedia = Utils.generateSocialMediaWithLinks({ socialMedia: user.socialMedia });

  let hasReceivedFundsWithoutMerchantCode = false;

  if (!user.bankAccounts || user.bankAccounts.length === 0) {
    const receivedTransfers = await Transfer.find({
      receiverPhoneNumber: user.phoneNumber,
      transferType: {
        $in: [
          Const.transferTypeSuperBless,
          Const.transferTypeMarketplace,
          Const.transferTypeMembership,
          Const.transferTypeCash,
          Const.transferTypeCreditPackage,
          Const.transferTypeCredits,
          Const.transferTypeSprayBless,
        ],
      },
      status: Const.transferComplete,
    }).lean();
    if (user.creditBalance > 0 || receivedTransfers.length !== 0) {
      hasReceivedFundsWithoutMerchantCode = true;
    }
  }
  user.hasReceivedFundsWithoutMerchantCode = hasReceivedFundsWithoutMerchantCode;

  const bonusTransfers = await Transfer.find({
    receiverPhoneNumber: user.phoneNumber,
    status: Const.transferComplete,
    bonusType: { $exists: true },
  }).lean();

  user.receivedBonusData = false;
  user.receivedBonusCredits = false;

  for (const transfer of bonusTransfers) {
    const { bonusType } = transfer;

    if (bonusType.startsWith("dataFor")) {
      user.receivedBonusData = true;
    } else if (bonusType.startsWith("creditsFor")) {
      user.receivedBonusCredits = true;
    }
  }

  let requestUser;

  if (!requestAccessToken) {
    delete user.notifications;
  } else {
    requestUser = await User.findOne({ "token.token": requestAccessToken }, { _id: 1 }).lean();
    if (!requestUser || requestUser._id.toString() !== userId) {
      delete user.notifications;
    }
  }

  delete user.activeLiveStream;
  const activeLiveStream = (
    await LiveStream.find({ userId, isActive: true }, null, {
      lean: true,
      sort: { created: -1 },
      limit: 1,
    }).lean()
  )[0];

  if (activeLiveStream) {
    const requestUserId = !requestUser ? null : requestUser._id.toString();

    const isAllowed = await isUserAllowed({
      liveStream: activeLiveStream,
      userId: requestUserId,
    });

    if (isAllowed) {
      user.activeLiveStream = activeLiveStream;
    }
  }

  user.isVerified = false;
  if (
    user.merchantApplicationStatus === Const.merchantApplicationStatusApprovedWithoutPayout ||
    user.merchantApplicationStatus === Const.merchantApplicationStatusApprovedWithPayout ||
    user.identityStatus === Const.identityStatusVerified ||
    (user.bankAccounts && user.bankAccounts.some((account) => account.merchantCode))
  ) {
    user.isVerified = true;
  }

  const tokens = user.token.map((token) => token.token);
  if (!tokens.includes(requestAccessToken)) {
    sanitizeUser({ user });
  }
}

function sanitizeUser({ user }) {
  delete user.token;
  delete user.pushToken;
  delete user.voipPushToken;
  delete user.webPushSubscription;
  delete user.paymentProfileId;
  delete user.emailActivation;

  for (let i = 0; i < user.UUID.length; i++) {
    delete user.UUID[i].UUID;
    delete user.UUID[i].pushTokens;
  }
}

async function isUserAllowed({ liveStream, userId = "None" }) {
  const { userId: streamerId, visibility, tribeIds } = liveStream;

  if (streamerId === userId) return true;

  if (visibility === "public" || visibility === "community") return true;

  if (userId === "None") return false;

  const memberIds = [];

  if (visibility === "tribes") {
    const tribes = await Tribe.find({ _id: { $in: tribeIds } }).lean();

    for (const tribe of tribes) {
      const {
        ownerId,
        members: { accepted },
      } = tribe;

      memberIds.push(ownerId);
      for (const member of accepted) {
        memberIds.push(member.id);
      }
    }
  }

  return memberIds.includes(userId);
}

module.exports = formatUserDetailsResponse;
