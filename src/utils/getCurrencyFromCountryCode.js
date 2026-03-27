const { Const, countries } = require("#config");

function getCurrencyFromCountryCode({ countryCode, rates }) {
  if (!countryCode) {
    throw new Error(Const.responsecodeUserNoCountryCode);
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
  throw new Error(Const.responsecodeNoCurrencyFound);
}

module.exports = getCurrencyFromCountryCode;
