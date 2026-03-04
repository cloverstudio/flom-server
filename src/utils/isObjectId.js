function isObjectId(str) {
  var checkForHexRegExp = /^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i;
  return checkForHexRegExp.test(str);
}

module.exports = isObjectId;
