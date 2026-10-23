const parsePhoneNumber = require("libphonenumber-js/max");

function maskPhoneNumber(input) {
  const phone = parsePhoneNumber(input);
  const cc = phone.countryCallingCode;
  const nat = phone.nationalNumber;
  if (nat.length <= 4) return `+${cc}${nat}`;
  return `+${cc}${nat.slice(0, 3)}${"*".repeat(nat.length - 4)}${nat.slice(-1)}`;
}

module.exports = maskPhoneNumber;
