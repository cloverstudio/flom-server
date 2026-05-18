const { Const } = require("#config");
const { User } = require("#models");
const getCountryCodeFromPhoneNumber = require("./getCountryCodeFromPhoneNumber");
const getConversionRates = require("./getConversionRates");
const getCurrencyFromCountryCode = require("./getCurrencyFromCountryCode");

async function getUsersConversionRate({ user, accessToken }) {
  if (!user) {
    if (!accessToken || accessToken.length !== Const.tokenLength)
      return { userRate: null, userCountryCode: null, userCurrency: null, conversionRates: null };

    user = await User.findOne({ "token.token": accessToken }).lean();
    if (!user)
      return { userRate: null, userCountryCode: null, userCurrency: null, conversionRates: null };
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

module.exports = getUsersConversionRate;
