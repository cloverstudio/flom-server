const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    phoneNumber: String,
    channel: String, // sms, whatsapp
    code: String,
    attempts: Number,
    expiresAt: Number,
    lastTryAt: Number,
    created: { type: Number, default: Date.now, index: true },
  },
  { timestamps: true },
);

module.exports = db.db1.model("VerificationRequest", schema, "verification_requests");
