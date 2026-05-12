const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    wamId: String,
    request: {},
    response: {},
    errors: [],
    status: String,
  },
  { timestamps: true },
);

module.exports = db.db1.model("WhatsAppLog", schema, "whatsapp_logs");
