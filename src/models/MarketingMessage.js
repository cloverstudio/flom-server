const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    name: String,
    userId: { type: String, index: true },
    marketingAction: Number, // 1-send message, 2-send product, 3-send shop, 4-send USSD
    message: String,
    receivers: [{ id: String, name: String, phoneNumber: String }],
    product: { id: String, name: String },
    created: { type: Number, index: true },
    template: { type: Boolean, default: false, index: true },
    phoneNumbersFromCSV: [String],
  },
  { timestamps: true },
);

module.exports = db.db1.model("MarketingMessage", schema, "marketing_messages");
