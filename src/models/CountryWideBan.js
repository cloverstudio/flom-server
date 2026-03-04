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

module.exports = db.db1.model("CountryWideBan", schema, "country_wide_bans");
