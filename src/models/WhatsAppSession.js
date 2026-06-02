const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    from: String, // phone number with leading +, e.g. +1234567890
    to: String, // phone number with leading +, e.g. +1234567890
    toSlug: String,
    expiresAt: Date,
  },
  { timestamps: true },
);

module.exports = db.db1.model("WhatsAppSession", schema, "whatsapp_sessions");
