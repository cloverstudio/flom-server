const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    countryCode: String,
    realRate: Number,
    adminRate: Number,
    realModified: Number,
    adminModified: Number,
    stateCode: String,
    zipCode: String,
  },
  { timestamps: true },
);

module.exports = db.db1.model("TaxRate", schema, "tax_rates");
