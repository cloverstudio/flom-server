const { Const } = require("#config");
const Utils = require("#utils");
const { TransferType } = require("#models");

async function getCountries({ phoneNumbers, countryCode }) {
  const numbersGroupedByCountry = groupNumbersByCountry({ phoneNumbers, countryCode });

  const conversionRates = await Utils.getConversionRates();
  const transferTypes = await TransferType.find().lean();

  const countries = [];
  const countryCodes = Object.keys(numbersGroupedByCountry);
  for (let i = 0; i < countryCodes.length; i++) {
    let conversionRate = getConversionRate({
      conversionRates,
      countryTo: countryCodes[i],
    });

    let transferTypesResponse = getTransferTypes({
      transferTypes,
      countryCode: countryCodes[i],
    });

    countries.push({
      countryCode: countryCodes[i],
      conversionRate,
      phoneNumbers: numbersGroupedByCountry[countryCodes[i]],
      transferTypes: transferTypesResponse,
    });
  }
  return countries;
}

function groupNumbersByCountry({ phoneNumbers, countryCode }) {
  const numbersWithCountry = [];
  for (let i = 0; i < phoneNumbers.length; i++) {
    const phoneNumber = Utils.formatPhoneNumber({ phoneNumber: phoneNumbers[i], countryCode });
    if (phoneNumber) {
      const phoneCountryCode = Utils.getCountryCodeFromPhoneNumber({
        phoneNumber,
        countryCode,
      });
      numbersWithCountry.push({ phoneNumber: phoneNumbers[i], countryCode: phoneCountryCode });
    }
  }

  return numbersWithCountry.reduce((r, a) => {
    r[a.countryCode] = [...(r[a.countryCode] || []), a.phoneNumber];
    return r;
  }, {});
}

function getConversionRate({ conversionRates, countryTo }) {
  try {
    let currencyTo, rate;
    try {
      currencyTo = Utils.getCurrencyFromCountryCode({
        countryCode: countryTo,
        rates: conversionRates.rates,
      });
    } catch (error) {
      console.error(`Currency for country ${countryTo} not found. Defaulting to USD`);
    }
    if (currencyTo) {
      const rateFrom = conversionRates.rates.USD;
      const rateTo = conversionRates.rates[currencyTo];

      rate = (1 / rateFrom) * rateTo;
    } else {
      currencyTo = "USD";
      rate = 1;
    }
    return {
      date: conversionRates.date,
      currencyFrom: "USD",
      currencyTo,
      rate,
    };
  } catch (error) {
    console.error("getCountries");
    console.error(error);
  }
}

function getTransferTypes({ transferTypes, countryCode }) {
  let allowed = [],
    notice,
    hasTopUp = false,
    hasData = false,
    hasCash = false,
    hasSats = false,
    hasDirectCash = false;
  for (let i = 0; i < transferTypes.length; i++) {
    if (transferTypes[i].supportedCountries.includes(countryCode) && !transferTypes[i].disabled) {
      allowed.push(transferTypes[i].type);
      if (transferTypes[i].type === Const.transferTypeTopUp) {
        hasTopUp = true;
      } else if (transferTypes[i].type === Const.transferTypeData) {
        hasData = true;
      } else if (transferTypes[i].type === Const.transferTypeCash) {
        hasCash = true;
      } else if (transferTypes[i].type === Const.transferTypeSats) {
        hasSats = true;
      } else if (transferTypes[i].type === Const.transferTypeDirectCash) {
        hasDirectCash = true;
      }
    }
  }

  //filtering transfer types for notice
  allowed = allowed.filter((transferType) => Const.noticeTransferTypes.includes(transferType));

  if (allowed.length === 0) {
    notice =
      "Gifting is not available for this contact’s country. Check to be sure the country code (e.g. +53, +268, etc.) is correct.";
  } else if (hasTopUp && !hasData && !hasCash) {
    notice = "Top-up transfers are supported for this contact's country";
  } else if (!hasTopUp && hasData && !hasCash) {
    notice = "Data transfers are supported for this contact's country";
  } else if (!hasTopUp && !hasData && hasCash) {
    notice = "Cash transfers are supported for this contact's country";
  }
  return { allowed, notice };
}

module.exports = { getCountries };
