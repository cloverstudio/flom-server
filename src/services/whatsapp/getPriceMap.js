const { logger } = require("#infra");
const { Const, countries } = require("#config");
const Utils = require("#utils");
const { WhatsAppPrice, ConversionRate } = require("#models");

async function getPriceMap(localCountryCode) {
  try {
    if (localCountryCode && !countries[localCountryCode]) {
      logger.warn(`getPriceMap, invalid localCountryCode: ${localCountryCode}`);
      return {};
    }

    const conversionRatesArray = await ConversionRate.find({}).sort({ date: -1 }).limit(1).lean();
    const rates =
      conversionRatesArray && conversionRatesArray.length > 0
        ? conversionRatesArray[0].rates
        : null;

    if (!rates) {
      logger.warn(`getPriceMap, no conversion rates found`);
      return {};
    }

    let localCurrency, localRate;
    if (localCountryCode) {
      localCurrency = countries[localCountryCode].currency.split(",")[0];
      if (localCurrency) {
        localRate = rates[localCurrency];
      }
    }

    const prices = await WhatsAppPrice.find().lean();

    if (!prices || prices.length === 0) {
      logger.warn(`getPriceMap, no WhatsApp prices found`);
      return {};
    }

    const countryCodesFromPrices = [];
    let defaultPrice = null;

    const priceMap = { localCurrency, localRate };
    prices.forEach((price) => {
      const { marketing, utility, service } = price;
      const countryCode = price.countryCode;

      if (countryCode === "default") {
        defaultPrice = price;
        return;
      }

      countryCodesFromPrices.push(countryCode);

      const satsRate = rates["SAT"];

      priceMap[countryCode] = {
        marketing: Math.ceil(marketing * Const.whatsAppMarkupRate * satsRate),
        utility: Math.ceil(utility * Const.whatsAppMarkupRate * satsRate),
        service: Math.ceil(service * Const.whatsAppMarkupRate * satsRate),
        marketingUsd: marketing,
        utilityUsd: utility,
        serviceUsd: service,
        ...(localRate && {
          marketingLocal: Utils.roundNumber(marketing * Const.whatsAppMarkupRate * localRate, 2),
          utilityLocal: Utils.roundNumber(utility * Const.whatsAppMarkupRate * localRate, 2),
          serviceLocal: Utils.roundNumber(service * Const.whatsAppMarkupRate * localRate, 2),
        }),
      };
    });

    for (const countryCode in countries) {
      if (!countryCodesFromPrices.includes(countryCode)) {
        const { marketing, utility, service } = defaultPrice;

        const satsRate = rates["SAT"];

        priceMap[countryCode] = {
          marketing: Math.ceil(marketing * Const.whatsAppMarkupRate * satsRate),
          utility: Math.ceil(utility * Const.whatsAppMarkupRate * satsRate),
          service: Math.ceil(service * Const.whatsAppMarkupRate * satsRate),
          marketingUsd: marketing,
          utilityUsd: utility,
          serviceUsd: service,
          ...(localRate && {
            marketingLocal: Utils.roundNumber(marketing * Const.whatsAppMarkupRate * localRate, 2),
            utilityLocal: Utils.roundNumber(utility * Const.whatsAppMarkupRate * localRate, 2),
            serviceLocal: Utils.roundNumber(service * Const.whatsAppMarkupRate * localRate, 2),
          }),
        };
      }
    }

    return priceMap;
  } catch (error) {
    logger.error("getPriceMap error: ", error);
    return null;
  }
}

module.exports = getPriceMap;
