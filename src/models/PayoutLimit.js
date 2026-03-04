const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    countryCode: String,
    min: Number,
    max: Number,
    created: { type: Number, default: Date.now },
    modified: { type: Number, default: Date.now },
  },
  { timestamps: true },
);

module.exports = db.db1.model("PayoutLimit", schema, "payout_limits");
