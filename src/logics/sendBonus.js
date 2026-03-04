"use strict";

const { logger } = require("#infra");
const Utils = require("#utils");
const getRabbitMqChannel = require("../rabbitmq/get-queue");

async function sendBonus({
  userId,
  userPhoneNumber,
  bonusType,
  productId,
  feedbackId,
  liveStreamId,
  supportTicketId,
  productName,
  liveStreamName,
  ownerId,
}) {
  try {
    const channel = await getRabbitMqChannel();

    const conversionRatesToday = await Utils.getConversionRates();
    let operator;
    if (bonusType.startsWith("dataFor")) {
      operator = await Utils.getCarrier({ phoneNumber: userPhoneNumber });
    }

    await channel.sendToQueue(
      "bonus-queue",
      Buffer.from(
        JSON.stringify({
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
          operator,
        })
      )
    );

    return;
  } catch (error) {
    logger.error("sendBonus", error);

    return;
  }
}

module.exports = sendBonus;
