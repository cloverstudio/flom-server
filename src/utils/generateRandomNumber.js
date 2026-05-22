const crypto = require("crypto");

function generateRandomNumber(numberOfDigits) {
  const lowerLimit = Math.pow(10, numberOfDigits - 1);
  const upperLimit = Math.pow(10, numberOfDigits);

  return crypto.randomInt(lowerLimit, upperLimit);
}

module.exports = generateRandomNumber;
