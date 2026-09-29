const { Const } = require("#config");
const { logger } = require("#infra");
const { Transfer } = require("#models");

const oneTimeBonuses = [
  Const.dataForSync,
  Const.dataForFirstPaymentOrApprovedProduct,
  Const.bonusTypeSync,
  Const.bonusTypeContent,
  Const.bonusTypeFeedback,
  Const.bonusTypeHighEngagementContent,
  Const.bonusTypeLiveStreamComment,
  Const.bonusTypePlayingFullContent,
  Const.bonusTypeBugReport,
];
const dailyLimitBonuses = [
  Const.bonusTypeComment,
  Const.bonusTypeLike,
  Const.bonusTypeRating,
  Const.bonusTypePlaying5Minutes,
];

async function checkIfBonusAlreadyReceived({
  phoneNumber,
  bonusType,
  bonusPaymentMethod = "credits",
  productId,
  feedbackId,
  liveStreamId,
  supportTicketId,
}) {
  try {
    if ([Const.dataForSync, Const.dataForFirstPaymentOrApprovedProduct].includes(bonusType)) {
      const query = {
        receiverPhoneNumber: phoneNumber,
        bonusType,
        ...(!!productId && { productId }),
      };

      const transfer = await Transfer.findOne(query);
      return { check: !!transfer };
    } else if (oneTimeBonuses.includes(bonusType)) {
      const query = {
        receiverPhoneNumber: phoneNumber,
        bonusType: { $in: [bonusType, `creditsFor${bonusType}`] },
        status: Const.transferComplete,
        ...(!!productId && { productId }),
        ...(!!feedbackId && { feedbackId }),
        ...(!!liveStreamId && { liveStreamId }),
        ...(!!supportTicketId && { supportTicketId }),
      };

      const transfer = await Transfer.findOne(query);
      return { check: !!transfer };
    } else if (dailyLimitBonuses.includes(bonusType)) {
      const query = {
        receiverPhoneNumber: phoneNumber,
        bonusType: { $in: [bonusType, `creditsFor${bonusType}`] },
        status: Const.transferComplete,
        ...(!!productId && { productId }),
        ...(!!liveStreamId && { liveStreamId }),
      };
      const transfer = await Transfer.findOne(query);
      if (!!transfer) return { check: true };

      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const todayStartTime = today.getTime();

      const match = {
        receiverPhoneNumber: phoneNumber,
        bonusType: { $in: [bonusType, `creditsFor${bonusType}`] },
        status: Const.transferComplete,
        created: { $gt: todayStartTime },
      };

      let aggregation,
        count = 0,
        sum = 0;

      if (bonusPaymentMethod === "credits") {
        match.transferType = Const.transferTypeCredits;

        aggregation = await Transfer.aggregate([
          {
            $match: match,
          },
          { $group: { _id: null, sum: { $sum: "$creditsAmount" }, count: { $sum: 1 } } },
        ]);

        if (aggregation?.length) {
          count = aggregation[0].count;
          sum = aggregation[0].sum;
        }
      } else {
        match.transferType = Const.transferTypeSats;

        aggregation = await Transfer.aggregate([
          {
            $match: match,
          },
          { $group: { _id: null, sum: { $sum: "$satsAmount" }, count: { $sum: 1 } } },
        ]);

        if (aggregation?.length) {
          count = aggregation[0].count;
          sum = aggregation[0].sum;
        }
      }

      const limit =
        bonusPaymentMethod === "credits"
          ? Const.bonusDailyLimitMapCredits[bonusType]
          : Const.bonusDailyLimitMapSats[bonusType];
      return { check: sum >= limit };
    }

    logger.warn(`invalid bonus type: ${bonusType}`);
    return { error: true };
  } catch (error) {
    logger.error("checkIfBonusAlreadyReceived: ", error.stack);
    return { error: true };
  }
}

module.exports = checkIfBonusAlreadyReceived;
