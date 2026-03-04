const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    price: Number,
    countryCode: String,
    created: { type: Number, default: Date.now },
    modified: Number,
  },
  { timestamps: true },
);

module.exports = db.db1.model("SMSPrice", schema, "sms_prices");
