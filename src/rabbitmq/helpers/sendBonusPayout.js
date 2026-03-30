const { Const, Config } = require("#config");
const Utils = require("#utils");
const { logger } = require("#infra");
const { Transfer, User, Payout, Notification } = require("#models");

const getCustomerActivationData = require("./getCustomerActivationData");

async function sendBonusPayout({ userId, bonusType, productId, conversionRatesToday }) {
  try {
    if (!userId) {
      logger.error(`sendBonusPayout, userId missing`);
      return;
    }

    const user = await User.findById(userId).lean();
    if (!user) {
      logger.error(`sendBonusPayout, user not found`);
      return;
    }

    const customerActivationData = await getCustomerActivationData();
    const {
      sendPayoutBonus,
      merchApplApprovalAmount,
      expoApprovalAmount,
      videoApprovalAmount,
      audioApprovalAmount,
      textApprovalAmount,
      maxProductBonusPayoutAmount,
      sendSmsNotificationForBonus,
    } = customerActivationData;

    if (!sendPayoutBonus) {
      throw new Error("sendBonusPayout, payout bonus disabled");
    }

    let amount = null;
    switch (bonusType) {
      case Const.payoutForApprovedMerchantApplication:
        amount = merchApplApprovalAmount;
        break;
      case Const.payoutForApprovedExpo:
        amount = expoApprovalAmount;
        break;
      case Const.payoutForApprovedVideo:
        amount = videoApprovalAmount;
        break;
      case Const.payoutForApprovedAudio:
        amount = audioApprovalAmount;
        break;
      case Const.payoutForApprovedText:
        amount = textApprovalAmount;
        break;
      default:
        throw new Error("invalid bonus type " + bonusType);
    }

    if (!amount) {
      logger.error(
        `sendBonusPayout, ${bonusType} approval amount not set in customer activation admin panel`,
      );
      return;
    }

    if (bonusType === "payoutForApprovedMerchantApplication") {
      const bonusTransfer = await Transfer.findOne({
        receiverPhoneNumber: user.phoneNumber,
        bonusType,
      }).lean();
      if (bonusTransfer) {
        return;
      }

      const bonusPayout = await Payout.findOne({
        receiverPhoneNumber: user.phoneNumber,
        bonusType,
      }).lean();
      if (bonusPayout) {
        return;
      }
    } else {
      const transferMatch = {
        receiverPhoneNumber: user.phoneNumber,
        bonusType: {
          $in: [
            Const.payoutForApprovedExpo,
            Const.payoutForApprovedVideo,
            Const.payoutForApprovedAudio,
            Const.payoutForApprovedText,
          ],
        },
        status: Const.transferComplete,
      };
      const payoutMatch = {
        receiverPhoneNumber: user.phoneNumber,
        bonusType: {
          $in: [
            Const.payoutForApprovedExpo,
            Const.payoutForApprovedVideo,
            Const.payoutForApprovedAudio,
            Const.payoutForApprovedText,
          ],
        },
        status: Const.payoutComplete,
      };

      const transferResult = await Transfer.aggregate([
        {
          $match: transferMatch,
        },
        { $group: { _id: null, sum: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]);
      let transferCount = 0,
        transferSum = 0;
      if (transferResult?.length) {
        transferCount = transferResult[0].count;
        transferSum = transferResult[0].sum;
      }

      const payoutResult = await Payout.aggregate([
        {
          $match: payoutMatch,
        },
        { $group: { _id: null, sum: { $sum: "$bonusAmount" }, count: { $sum: 1 } } },
      ]);
      let payoutCount = 0,
        payoutSum = 0;
      if (payoutResult?.length) {
        payoutCount = payoutResult[0].count;
        payoutSum = payoutResult[0].sum;
      }

      const sum = Utils.roundNumber(transferSum + payoutSum + amount, 2);

      if (sum > maxProductBonusPayoutAmount) {
        logger.error("Bonus consumer, maximum payout for products reached");
        return;
      }
    }

    const { rates } = conversionRatesToday;

    let paypalEmail = null,
      bankAccount = null;

    if (user.phoneNumber.startsWith("+234")) {
      let selectedAccount = null,
        fbnAccount = null,
        nonFbnAccount = null;
      for (const acc of user.bankAccounts) {
        if (acc.selected) selectedAccount = acc;
        if (acc.code === "011") fbnAccount = acc;
        else if (acc.code !== "" && Number.isInteger(+acc.code)) nonFbnAccount = acc;
      }

      bankAccount = selectedAccount
        ? selectedAccount.code !== "" && Number.isInteger(+selectedAccount.code)
          ? selectedAccount
          : fbnAccount ?? nonFbnAccount
        : fbnAccount ?? nonFbnAccount;
    } else {
      paypalEmail = user.paypalEmail;
    }

    const payoutRequest = {
      payoutData: {
        transferIds: [],
        cashAmount: 0,
        creditsAmount: 0,
        creditsAmountInUSD: 0,
        satsAmount: 0,
        satsAmountInUSD: 0,
        totalAmount: amount,
        bonusAmount: amount,
      },
      bonusType,
      productId,
    };

    if (bankAccount) {
      payoutRequest.payoutMethodType = Const.payoutMethodTypeBankAccount;
      payoutRequest.bankAccountNumber = bankAccount.accountNumber;
      payoutRequest.bankCode = bankAccount.code;
    } else if (paypalEmail) {
      payoutRequest.payoutMethodType = Const.payoutMethodTypePaypal;
      payoutRequest.paypalEmail = paypalEmail;
    } else {
      await sendSatsBonus({
        user,
        rates,
        amount: amount,
        bonusType,
        sendSmsNotificationForBonus,
        productId,
      });
      return;
    }

    await sendPayoutRequest({ payoutRequest, token: user.token[0]?.token });

    return;
  } catch (error) {
    logger.error(`sendBonusPayout, bonus type "${bonusType}" for userId ${userId}`, error);
    return;
  }
}

async function sendSatsBonus({
  user,
  rates,
  amount,
  bonusType,
  sendSmsNotificationForBonus,
  productId,
}) {
  const amountForTransfer = amount;
  const satsRate = rates["SAT"];
  const satsAmount = Math.ceil(satsRate * amountForTransfer);

  const userCountryCode =
    user.countryCode || Utils.getCountryCodeFromPhoneNumber({ phoneNumber: user.phoneNumber });
  const userCurrency = Utils.getCurrencyFromCountryCode({ countryCode: userCountryCode, rates });

  const userRate = rates[userCurrency];
  const userAmount = Utils.roundNumber(amountForTransfer * userRate, 2);

  const { phoneNumber: flomAgentPhoneNumber } =
    (await User.findById(Config.flomSupportAgentId).lean()) || {};

  const transferData = {
    senderId: Config.flomSupportAgentId,
    senderPhoneNumber: flomAgentPhoneNumber || "FLOM",
    receiverId: user._id.toString(),
    receiverPhoneNumber: user.phoneNumber,
    source: "flom_v1",
    amount: amountForTransfer,
    satsAmount,
    originalPrice: { countryCode: "US", currency: "USD", value: amountForTransfer },
    localAmountSender: { countryCode: "US", currency: "USD", value: amountForTransfer },
    localAmountReceiver: {
      countryCode: userCountryCode,
      currency: userCurrency,
      value: userAmount,
    },
    status: Const.transferComplete,
    paymentMethodType: Const.paymentMethodTypeInternal,
    transferType: Const.transferTypeSats,
    productName: "Bonus sats for approved " + bonusType.replace("-", " "),
    bonusType: bonusType,
    created: Date.now(),
  };

  if (productId) {
    transferData.productId = productId;
  }

  await Transfer.create(transferData);

  await User.findByIdAndUpdate(user._id.toString(), { $inc: { satsBalance: satsAmount } });

  const message = Const.bonusPayoutMessage.replace("PAYOUT_METHOD account", "sats balance");

  await handleNotifications({ user, bonusType, message, sendSmsNotificationForBonus });
}

async function sendPayoutRequest({ payoutRequest, token = null }) {
  if (!token) {
    logger.error(`sendBonusPayout, user ${payoutRequest.receiverPhoneNumber} does not have token`);
  }

  await Utils.sendRequest({
    method: "POST",
    url: Config.paymentServiceBaseUrl + "/api/v2/payment/payout/execute",
    headers: { "access-token": token },
    body: payoutRequest,
  });
}

async function handleNotifications({ user, bonusType, message, sendSmsNotificationForBonus }) {
  const flomAgent = await User.findById(Config.flomSupportAgentId).lean();

  await Notification.create({
    receiverIds: [user._id.toString()],
    title: `You received a bonus from Flom for approved ` + bonusType.replace("-", " "),
    senderId: Config.flomSupportAgentId,
    notificationType: Const.notificationTypeBonus,
    created: Date.now(),
  });

  await User.findByIdAndUpdate(user._id.toString(), {
    $inc: { "notifications.unreadCount": 1 },
  });
  Utils.sendFlomPush({
    newUser: flomAgent,
    receiverUser: user,
    message,
    messageiOs: message,
    pushType: Const.pushTypeBonusSent,
    isMuted: true,
  });

  const sendSms =
    !sendSmsNotificationForBonus || sendSmsNotificationForBonus === false ? false : true;

  if (Config.environment === "production" && sendSms) {
    Utils.sendSMSv2({ phoneNumber: user.phoneNumber, message, type: "bonus" });
  }
}

module.exports = sendBonusPayout;
