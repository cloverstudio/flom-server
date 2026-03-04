function roundNumber(number, numberOfDigits, direction = "round") {
  const roundFunction =
    direction === "up" ? Math.ceil : direction === "down" ? Math.floor : Math.round;

  const n = 10 ** numberOfDigits;
  return roundFunction(number * n) / n;
}

module.exports = roundNumber;
