"use strict";

const { logger } = require("#infra");
const Utils = require("#utils");
const getCarrier = require("./getCarrier");
const getRabbitMqChannel = require("../rabbitmq/get-queue");
const { ConversionRate } = require("#models");

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

    const conversionRatesToday = await ConversionRate.getRates();
    let operator;
    if (bonusType.startsWith("dataFor")) {
      operator = await getCarrier({ phoneNumber: userPhoneNumber });
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
        }),
      ),
    );

    return;
  } catch (error) {
    logger.error("sendBonus", error);

    return;
  }
}

module.exports = sendBonus;
