const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    type: Number, // 1 - Tax, 2- Fee, 3 - Payout limit, 4 - Credits spray amout, 5 - Credits conversion rate, 6 - Credits limit
    oldValue: Object,
    newValue: Object,
    adminUserId: String,
    adminUsername: String,
    created: { type: Number, default: Date.now },
  },
  { timestamps: true },
);

module.exports = db.db1.model("PaymentLog", schema, "payment_log");
