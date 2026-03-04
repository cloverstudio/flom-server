const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    _id: String,
    provider: String,
    sku: Number,
    name: String,
    description: String,
    type: { type: String },
    minAmount: Number,
    maxAmount: Number,
    exchangeRate: Number,
    currencyCode: String,
    countryCode: { type: String, index: true },
    operator: String,
    logoUrl: String,
    created: { type: Number, default: Date.now },
  },
  { timestamps: true },
);

module.exports = db.db1.model("ThirdPartyProduct", schema, "third_party_products");
