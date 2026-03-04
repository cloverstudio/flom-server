const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    type: Number,
    name: String,
    disabled: { type: Boolean, default: false },
    supportedCountries: [String],
    promoText: String,
  },
  { timestamps: true },
);

module.exports = db.db1.model("TransferType", schema, "transfer_types");
