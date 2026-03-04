const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    phoneNumber: String,
    message: String,
    countryCode: String,
    isBatch: Boolean,
    service: String,
    operator: String,
    smsType: String,
    smsTry: Number,
    price: Number, // 100ths of a cent
    identifier: String,
    apiRequest: {},
    apiResponse: {},
    apiCallback: {},
    status: String,
    failureReason: mongoose.Schema.Types.Mixed,
    internalError: mongoose.Schema.Types.Mixed,
    created: { type: Number, index: true },
  },
  { timestamps: true },
);

module.exports = db.db1.model("SMSData", schema, "sms_data");
