function generateRandomNumber(numberOfDigits) {
  let base = 1;

  for (let i = 0; i < numberOfDigits - 1; i++) {
    base *= 10;
  }

  return Math.floor(base + Math.random() * base);
}

module.exports = generateRandomNumber;
