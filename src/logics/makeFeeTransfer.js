"use strict";

const { logger } = require("#infra");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { User, LiveStream, Notification, Tribe, Transfer } = require("#models");

async function makeFeeTransfer({ fee, feeType, sender, numberOfWaMessages }) {
  try {
    if (!fee || fee <= 0) {
      logger.error(`makeFeeTransfer, invalid fee: ${fee}`);
      return null;
    }

    const flomAgent = await User.findById(Config.flomSettlementAgentId).lean();

    const { rates = null } = await Utils.getConversionRates();

    if (!rates) {
      logger.error(`makeFeeTransfer, failed to get conversion rates`);
      return null;
    }

    const agentCurrency = flomAgent.currency || "USD";
    const senderCurrency =
      sender.currency ||
      Utils.getCurrencyFromCountryCode({ countryCode: sender.countryCode, rates: rates }) ||
      "USD";

    const localAmountReceiver = {
      countryCode: agentCurrency === "USD" ? "US" : flomAgent.countryCode,
      currency: agentCurrency,
      value: Utils.roundNumber((fee / rates["SAT"]) * rates[agentCurrency], 2),
    };
    const localAmountSender = {
      countryCode: sender.countryCode,
      currency: senderCurrency,
      value: Utils.roundNumber((fee / rates["SAT"]) * rates[senderCurrency], 2),
    };

    await User.updateOne({ _id: sender._id }, { $inc: { satsBalance: -fee } });
    await User.updateOne({ _id: flomAgent._id }, { $inc: { satsBalance: fee } });

    let productName = `${feeType} fee`;
    if (numberOfWaMessages) {
      productName += ` (${numberOfWaMessages} WhatsApp messages)`;
    }

    await Transfer.create({
      senderType: "user",
      senderId: sender._id.toString(),
      senderPhoneNumber: sender.phoneNumber,
      receiverId: flomAgent._id.toString(),
      receiverPhoneNumber: flomAgent.phoneNumber,
      transferType: Const.transferTypeMessagingFee,
      paymentMethodType: Const.paymentMethodTypeSatsBalance,
      originalPrice: { countryCode: "SAT", currency: "SAT", value: fee },
      satsAmount: fee,
      localAmountSender,
      localAmountReceiver,
      message: "",
      status: Const.transferComplete,
      source: "flom_v1",
      productName,
    });

    return true;
  } catch (error) {
    logger.error("makeFeeTransfer error: ", error);
    return null;
  }
}

module.exports = makeFeeTransfer;
