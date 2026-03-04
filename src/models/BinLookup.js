const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    binNumber: String,
    countryCode: String,
    created: {
      type: Number,
      default: Date.now,
    },
  },
  { timestamps: true },
);

module.exports = db.db2.model("BinLookup", schema, "bin_lookups");
