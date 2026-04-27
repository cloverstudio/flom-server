const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    senderPhoneNumber: String,
    receiverPhoneNumber: String,
  },
  { timestamps: true },
);

module.exports = db.db1.model("WhatsAppUserMapping", schema, "whatsapp_user_mappings");
