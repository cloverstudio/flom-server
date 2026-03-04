const Config = require("./config");
const Constants = require("./constants");
const countries = require("./countries");
const countries2to3 = require("./countries2to3");
const ResponseCodes = require("./response-codes");

module.exports = {
  Config,
  Const: {
    ...Constants,
    ...ResponseCodes,
  },
  countries,
  countries2to3,
};
