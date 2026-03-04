const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    productId: String,
    values: [{ countryCode: String, value: Number, priceForWeb: Number, _id: false }],
    created: { type: Number, default: Date.now },
  },
  { timestamps: true },
);

module.exports = db.db1.model("CreditPackage", schema, "credit_packages");
