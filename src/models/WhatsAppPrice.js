const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    country: String,
    countryCode: String,
    currency: String,
    marketing: Number,
    utility: Number,
  },
  { timestamps: true },
);

module.exports = db.db1.model("WhatsAppPrice", schema, "whatsapp_prices");
