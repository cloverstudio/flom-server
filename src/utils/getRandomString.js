const possible = {
  alphanumeric: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
  numeric: "0123456789",
  alpha: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
};

function getRandomString(length, type) {
  let text = "";
  const possibleChars = possible[type] || possible.alphanumeric;

  if (!length) {
    length = 32;
  }

  for (let i = 0; i < length; i++)
    text += possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));

  return text;
}

module.exports = getRandomString;
