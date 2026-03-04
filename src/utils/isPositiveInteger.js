function isPositiveInteger(n) {
  return n >>> 0 === parseFloat(n);
}

module.exports = isPositiveInteger;
