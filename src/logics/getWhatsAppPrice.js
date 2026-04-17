const { logger } = require("#infra");
const { WhatsAppPrice } = require("#models");

async function getWhatsAppPrice(countryCode = "XX") {
  try {
    const prices = await WhatsAppPrice.find({
      countryCode: { $in: [countryCode, "default"] },
    }).lean();

    if (!prices || prices.length === 0) {
      logger.warn(`No WhatsApp price found for country code: ${countryCode}`);
      return null;
    }

    if (prices.length === 1) {
      return prices[0];
    }

    return (
      prices.find((p) => p.countryCode === countryCode) ||
      prices.find((p) => p.countryCode === "default")
    );
  } catch (error) {
    logger.error("getWhatsAppPrice error: ", error);
    return null;
  }
}

module.exports = getWhatsAppPrice;
