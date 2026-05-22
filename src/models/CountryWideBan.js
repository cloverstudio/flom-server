const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    countryCode: { type: String, index: true },
    created: { type: Number, index: true },
    updated: Number,
    occurences: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const CountryWideBan = db.db1.model("CountryWideBan", schema, "country_wide_bans");

const ExtendedCountryWideBan = class ExtendedCountryWideBan extends CountryWideBan {
  static getDuration(occurences) {
    if (occurences === 0 || !occurences) return 0;
    else if (occurences === 1) return 5;
    else if (occurences === 2) return 10;
    else if (occurences === 3) return 15;
    else if (occurences === 4) return 30;
    else if (occurences > 4) return 60;
  }
};

module.exports = ExtendedCountryWideBan;
