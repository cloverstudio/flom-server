const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    productId: String,
    provider: String,
    countryCode: String,
    operator: String,
    sku: Number,
    name: String,
    type: { type: String },
    created: { type: Number, default: Date.now },
  },
  { timestamps: true },
);

module.exports = db.db1.model("BlockedThirdPartyProduct", schema, "blocked_third_party_products");
