const parsePhoneNumber = require("libphonenumber-js/max");

function getCountryCodeFromPhoneNumber({ phoneNumber, countryCode }) {
  const parsedPhoneNumber = parsePhoneNumber(phoneNumber, countryCode);
  if (parsedPhoneNumber && parsedPhoneNumber.isValid()) {
    return parsedPhoneNumber.country;
  } else {
    return null;
  }
}

module.exports = getCountryCodeFromPhoneNumber;
