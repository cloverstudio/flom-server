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
    type: String,
    waType: String,
    template: String,
    to: String,
    from: String,
    direction: String, // incoming, outgoing
    providerId: String,
    providerPhoneNumber: String,
    created: { type: Number, default: Date.now },
  },
  { timestamps: true },
);

module.exports = db.db1.model("WhatsAppLog", schema, "whatsapp_logs");
