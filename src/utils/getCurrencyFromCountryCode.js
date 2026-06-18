const { logger } = require("#infra");
const { Const, countries } = require("#config");

function getCurrencyFromCountryCode({ countryCode, rates }) {
  if (!countryCode) {
    // throw new Error(Const.responsecodeUserNoCountryCode);
    logger.error("getCurrencyFromCountryCode, countryCode is missing");
    return null;
  }

  let country = countries[countryCode];
  if (!country) {
    country = countries["US"];
  }

  let currencies = country.currency.split(",");
  for (let i = 0; i < currencies.length; i++) {
    if (rates[currencies[i]]) {
      return currencies[i].toUpperCase();
    }
  }

  //throw new Error(Const.responsecodeNoCurrencyFound);
  logger.error(`getCurrencyFromCountryCode, no currency found for countryCode: ${countryCode}`);
  return null;
}

module.exports = getCurrencyFromCountryCode;
