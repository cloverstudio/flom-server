const { Const, countries } = require("#config");
const { User } = require("#models");
const getCountryCodeFromPhoneNumber = require("./getCountryCodeFromPhoneNumber");
const getConversionRates = require("./getConversionRates");

async function getUsersConversionRate({ user, accessToken }) {
  if (!user) {
    if (!accessToken || accessToken.length !== Const.tokenLength) return { userRate: null };

    user = await User.findOne({ "token.token": accessToken }).lean();
    if (!user) return { userRate: null };
  }

  const userCountryCode =
    user.countryCode || getCountryCodeFromPhoneNumber({ phoneNumber: user.phoneNumber });
  const conversionRates = await getConversionRates();
  const userCurrency = getCurrencyFromCountryCode({
    countryCode: userCountryCode,
    rates: conversionRates.rates,
  });
  const userRate = conversionRates.rates[userCurrency];

  return { userRate, userCountryCode, userCurrency, conversionRates };
}

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

module.exports = getUsersConversionRate;
