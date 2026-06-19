const { logger } = require("#infra");
const { Config, Const, countries } = require("#config");
const Utils = require("#utils");
const { ConversionRate } = require("#models");

async function convertCurrency({
  amount,
  from,
  to,
  fromCountryCode,
  toCountryCode,
  conversionRates,
}) {
  try {
    if (!conversionRates) {
      conversionRates = await ConversionRate.getRates();
    }

    if (!conversionRates || !conversionRates.rates) {
      throw new Error("Conversion rates not found");
    }

    const fromCurrency =
      from ||
      Utils.getCurrencyFromCountryCode({
        countryCode: fromCountryCode,
        rates: conversionRates.rates,
      });
    const toCurrency =
      to ||
      Utils.getCurrencyFromCountryCode({
        countryCode: toCountryCode,
        rates: conversionRates.rates,
      });

    if (!fromCurrency || !toCurrency) {
      throw new Error("Currency not found");
    }

    const convertedAmount =
      (amount * conversionRates.rates[toCurrency]) / conversionRates.rates[fromCurrency];

    return { convertedAmount: Utils.roundNumber(convertedAmount, 2), conversionRates };
  } catch (error) {
    logger.error("Error in convertCurrency:", error);
    return null;
  }
}

module.exports = convertCurrency;
