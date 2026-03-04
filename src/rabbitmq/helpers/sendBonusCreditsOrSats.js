const { Const, Config } = require("#config");
const Utils = require("#utils");
const { logger } = require("#infra");
const { Transfer, User, Product } = require("#models");

const checkIfBonusAlreadyReceived = require("./checkIfBonusAlreadyReceived");

async function sendBonusCreditsOrSats({
  userId,
  bonusType,
  feedbackId,
  productId,
  productName,
  ownerId,
  liveStreamId,
  liveStreamName,
  supportTicketId,
  linkedProductId,
}) {
  try {
    const user = await User.findById(userId).lean();

    let creditsBonusAmount = 0,
      satsBonusAmount = 0;
    let reason = "";
    let bonusPaymentMethod =
      Config.environment !== "production" ? user.bonusPaymentMethod || "credits" : "credits";

    if (bonusType === Const.bonusTypeVisitingStreak) {
      const { visitingStreak = [] } = user;

      const lastStreakTimestamp = visitingStreak[0] ?? null;

      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      const newStreakTimestamp = today.getTime();

      if (newStreakTimestamp === lastStreakTimestamp) {
        return;
      }

      if (yesterday.getTime() !== lastStreakTimestamp) {
        await User.findByIdAndUpdate(userId, { visitingStreak: [] });

        user.visitingStreak = [];
      }

      await User.findByIdAndUpdate(userId, {
        $push: { visitingStreak: { $each: [newStreakTimestamp], $position: 0 } },
      });

      const streak = user.visitingStreak.length + 1;
      creditsBonusAmount = Const.visitingStreakBonusMap[streak] ?? Const.visitingStreakBonusMap[5];
      satsBonusAmount = Const.visitingStreakBonusMap[streak] ?? Const.visitingStreakBonusMap[5];
      reason = `visiting ${streak} days in a row`;
    } else if (bonusType === Const.creditsForLinkedProductInExpo) {
      bonusPaymentMethod = "credits";

      const linkedProduct = await Product.findById(linkedProductId).lean();

      const {
        isDeleted,
        ownerId: linkedOwnerId,
        engagementBonus: {
          allowed = false,
          allowEngagementBonus = false,
          budgetCredits = 0,
          engagementBudgetCredits: engagementBudgetCreditsNew = 0,
          creditsPerLinkedExpo = 0,
        } = {},
      } = linkedProduct;

      const engagementBonusAllowed = allowed || allowEngagementBonus;
      const engagementBudgetCredits = budgetCredits || engagementBudgetCreditsNew;

      if (isDeleted || !engagementBonusAllowed || creditsPerLinkedExpo === 0) {
        logger.error(
          `sendBonusCreditsOrSats - credit bonus per linked expo, product deleted/bonus not allowed/no credits`
        );
        return;
      }

      if (creditsPerLinkedExpo > engagementBudgetCredits) {
        logger.error(`sendBonusCreditsOrSats - credit bonus per linked expo, budget spent`);
        return;
      }

      ownerId = linkedOwnerId;
      creditsBonusAmount = creditsPerLinkedExpo;
      reason = Const.bonusReasonMap[bonusType];
      if (reason.includes("CONTENT_NAME")) {
        reason = reason.replace("CONTENT_NAME", linkedProduct.productName);
      }
    } else {
      const check = await checkIfBonusAlreadyReceived({
        phoneNumber: user.phoneNumber,
        bonusType,
        bonusPaymentMethod,
        productId,
        feedbackId,
        liveStreamId,
        supportTicketId,
      });

      if (check) return;

      creditsBonusAmount = Const.bonusAmountMapCredits[bonusType];
      satsBonusAmount = Const.bonusAmountMapSats[bonusType];
      reason = Const.bonusReasonMap[bonusType];
      if (reason.includes("CONTENT_NAME")) {
        reason = reason.replace("CONTENT_NAME", productName || liveStreamName);
      }
    }

    const takeFromFlomAgent = ![
      Const.bonusTypePlaying5Minutes,
      Const.bonusTypePlayingFullContent,
      Const.creditsForLinkedProductInExpo,
    ].includes(bonusType);

    const sender =
      (!takeFromFlomAgent
        ? await User.findById(ownerId).lean()
        : await User.findById(Config.flomSupportUserId).lean()) || {};

    if (!sender) {
      logger.error(
        `sendBonusCreditsOrSats - sender ${ownerId || Config.flomSupportUserId} not found`
      );
      return;
    }

    const { creditBalance = 0, satsBalance = 0 } = sender;

    if (bonusPaymentMethod === "credits" && creditsBonusAmount > creditBalance) {
      logger.error(`sendBonusCreditsOrSats - sender credit balance insufficient`);
      return;
    }
    if (bonusPaymentMethod === "sats" && satsBonusAmount > satsBalance) {
      logger.error(`sendBonusCreditsOrSats - sender sats balance insufficient`);
      return;
    }

    const senderId = sender._id.toString();

    let incUser =
      bonusPaymentMethod === "credits"
        ? { creditBalance: creditsBonusAmount }
        : { satsBalance: satsBonusAmount };
    let incSender =
      bonusPaymentMethod === "credits"
        ? { creditBalance: -creditsBonusAmount }
        : { satsBalance: -satsBonusAmount };

    await User.findByIdAndUpdate(userId, { $inc: incUser });
    await User.findByIdAndUpdate(senderId, { $inc: incSender });

    if (bonusType === Const.creditsForLinkedProductInExpo) {
      await User.findByIdAndUpdate(senderId, {
        $inc: {
          "engagementBonus.budgetCredits": -creditsBonusAmount,
          engagementBudgetCredits: -creditsBonusAmount,
        },
      });
    }

    const transferData = {
      senderId,
      senderPhoneNumber: sender.phoneNumber,
      senderCountryCode: sender.countryCode,
      receiverId: userId,
      receiverPhoneNumber: user.phoneNumber,
      receiverCountryCode: user.countryCode,
      source: "flom_v1",
      ...(bonusPaymentMethod === "credits"
        ? { creditsAmount: creditsBonusAmount }
        : { satsAmount: satsBonusAmount }),
      status: Const.transferComplete,
      paymentMethodType: takeFromFlomAgent
        ? Const.paymentMethodTypeInternal
        : bonusPaymentMethod === "credits"
        ? Const.paymentMethodTypeCreditBalance
        : Const.paymentMethodTypeSatsBalance,
      transferType:
        bonusPaymentMethod === "credits" ? Const.transferTypeCredits : Const.transferTypeSats,
      productName: `Bonus ${bonusPaymentMethod} for ${reason}`,
      bonusType,
      created: Date.now(),
      productId,
      feedbackId,
      liveStreamId,
      supportTicketId,
      linkedProductId,
    };

    await Transfer.create(transferData);

    const bonusMessage = Const.bonusMessage.replace(
      "BONUS_PAYMENT_METHOD",
      bonusPaymentMethod === "credits" ? "Credits" : "Sats"
    );

    Utils.sendFlomPush({
      newUser: sender,
      receiverUser: user,
      message: bonusMessage,
      messageiOs: bonusMessage,
      pushType: Const.pushTypeBonusSent,
      isMuted: true,
    });
  } catch (error) {
    logger.error("sendBonusCreditsOrSats", error);

    return;
  }
}

module.exports = sendBonusCreditsOrSats;
