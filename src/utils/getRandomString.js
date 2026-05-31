const crypto = require("crypto");

const possible = {
  alphanumeric: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
  numeric: "0123456789",
  alpha: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
};

function getRandomString(length, type = "alphanumeric") {
  let text = "";
  const possibleChars = possible[type];

  if (!length) {
    length = 32;
  }

  const rand = crypto.randomInt(0, possibleChars.length);

  for (let i = 0; i < length; i++) text += possibleChars.charAt(rand);

  return text;
}

module.exports = getRandomString;
