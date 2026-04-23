const { logger } = require("#infra");
const { Const, countries } = require("#config");
const Utils = require("#utils");
const { WhatsAppPrice, ConversionRate } = require("#models");

async function getWhatsAppPrices({ countryCode = "XX" }) {
  try {
    const prices = await WhatsAppPrice.find(
      { countryCode: { $in: [countryCode, "default"] } },
      { marketing: 1, utility: 1, countryCode: 1, _id: 0 },
    ).lean();

    if (!prices || prices.length === 0) {
      logger.warn(`No WhatsApp price found for country code: ${countryCode}`);
      return null;
    }

    const conversionRates = await ConversionRate.find({}).sort({ date: -1 }).limit(1).lean();
    const satsRate =
      conversionRates && conversionRates.length > 0 ? conversionRates[0].rates["SAT"] : null;
    const currency = countries[countryCode] ? countries[countryCode].currency.split(",")[0] : null;
    const localRate =
      conversionRates && conversionRates.length > 0 && currency
        ? conversionRates[0].rates[currency]
        : null;

    if (!satsRate) {
      logger.warn("No conversion rate found for SAT");
      return null;
    }

    for (const price of prices) {
      if (localRate) {
        price.currencyLocal = currency;

        price.marketingLocal = Utils.roundNumber(
          price.marketing * Const.whatsAppMarkupRate * localRate,
          2,
        );
        price.utilityLocal = Utils.roundNumber(
          price.utility * Const.whatsAppMarkupRate * localRate,
          2,
        );
      }

      price.marketing = Math.ceil(price.marketing * Const.whatsAppMarkupRate * satsRate);
      price.utility = Math.ceil(price.utility * Const.whatsAppMarkupRate * satsRate);
    }

    if (prices.length === 1) {
      return prices[0];
    }

    return (
      prices.find((p) => p.countryCode === countryCode) ||
      prices.find((p) => p.countryCode === "default")
    );
  } catch (error) {
    logger.error("getWhatsAppPrices error: ", error);
    return null;
  }
}

module.exports = getWhatsAppPrices;
