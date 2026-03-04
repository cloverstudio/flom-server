"use strict";

const { sendBonusData, sendBonusPayout, sendBonusCreditsOrSats } = require("../helpers");

module.exports = async (JSONData) => {
  if (!JSONData) return;

  const data = JSON.parse(JSONData.content);
  // logger.info("Bonus consumer data: " + JSON.stringify(data));

  const {
    userId,
    bonusType,
    productId,
    feedbackId,
    liveStreamId,
    supportTicketId,
    conversionRatesToday,
    productName,
    liveStreamName,
    ownerId,
    linkedProductId,
    operator,
  } = data;

  if (bonusType.startsWith("dataFor")) {
    await sendBonusData({
      userId,
      bonusType,
      conversionRatesToday,
      productId,
      feedbackId,
      operator,
    });
  } else if (bonusType === "payoutForApprovedMerchantApplication") {
    await sendBonusPayout({
      userId,
      bonusType,
      productId,
      conversionRatesToday,
    });
  } else if (bonusType) {
    await sendBonusCreditsOrSats({
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
    });
  }

  return;
};
