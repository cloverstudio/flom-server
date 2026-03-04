const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    countryCode: String,
    senderDailyLimit: Number,
    senderWeeklyLimit: Number,
    senderMonthlyLimit: Number,
    receiverDailyLimit: Number,
    receiverWeeklyLimit: Number,
    receiverMonthlyLimit: Number,
    created: { type: Number, default: Date.now },
    modified: { type: Number, default: Date.now },
  },
  { timestamps: true },
);

module.exports = db.db1.model("CreditTransferLimit", schema, "credit_transfer_limits");
