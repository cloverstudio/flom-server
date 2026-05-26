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
    callback: {},
    failures: [],
    status: String,
    template: String,
    to: String,
    from: String,
    direction: String, // incoming, outgoing
    providerId: String,
    providerPhoneNumber: String,
  },
  { timestamps: true },
);

module.exports = db.db1.model("WhatsAppLog", schema, "whatsapp_logs");
