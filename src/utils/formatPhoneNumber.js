const parsePhoneNumber = require("libphonenumber-js/max");

function formatPhoneNumber({ phoneNumber, countryCode }) {
  if (!phoneNumber) {
    return null;
  }

  let parsedPhoneNumber = parsePhoneNumber(phoneNumber, countryCode);
  if (parsedPhoneNumber && parsedPhoneNumber.isValid()) {
    return parsedPhoneNumber.number;
  }

  phoneNumber = phoneNumber.replace(/\D/g, "");
  if (phoneNumber.startsWith(" ") || phoneNumber.startsWith("0")) {
    phoneNumber = "+" + phoneNumber.substring(1);
  }

  if (!phoneNumber.startsWith("+")) {
    phoneNumber = "+" + phoneNumber;
  }

  parsedPhoneNumber = parsePhoneNumber(phoneNumber, countryCode);
  if (parsedPhoneNumber && parsedPhoneNumber.isValid()) {
    return parsedPhoneNumber.number;
  }
  return null;
}

module.exports = formatPhoneNumber;
