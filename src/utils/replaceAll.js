function replaceAll(text, pattern, replacement) {
  const result = text.replace(pattern, replacement);
  if (!result.includes(pattern)) return result;
  return replaceAll(result, pattern, replacement);
}

module.exports = replaceAll;
