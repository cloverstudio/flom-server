const crypto = require("crypto");

function generateRandomNumber(numberOfDigits) {
  const lowerLimit = Math.pow(10, numberOfDigits - 1);
  const upperLimit = Math.pow(10, numberOfDigits);

  // lower limit is included, upper limit is excluded
  return crypto.randomInt(lowerLimit, upperLimit);
}

module.exports = generateRandomNumber;
