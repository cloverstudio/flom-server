const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    phoneNumber: String,
    IP: String,
    UUID: String,
    loginType: String, // sms, ussd, didww
    timestamp: String,
    countryCode: String,
    created: { type: Number, default: Date.now, index: true },
  },
  { timestamps: true },
);

module.exports = db.db1.model("AccessRecord", schema, "access_records");
