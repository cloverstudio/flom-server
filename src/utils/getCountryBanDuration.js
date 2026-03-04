function getCountryBanDuration(occurences) {
  if (occurences === 0 || !occurences) return 0;
  else if (occurences === 1) return 5;
  else if (occurences === 2) return 10;
  else if (occurences === 3) return 15;
  else if (occurences === 4) return 30;
  else if (occurences > 4) return 60;
}

module.exports = getCountryBanDuration;
