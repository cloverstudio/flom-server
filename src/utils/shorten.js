function shorten(str, limit) {
  if (!limit) limit = 20;

  if (str.length > limit) str = str.substring(0, limit - 3) + "...";

  return str;
}

module.exports = shorten;
