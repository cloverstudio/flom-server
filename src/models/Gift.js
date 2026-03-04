const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    type: { type: Number, index: true }, // 1 for airtime, 2 for data
    userId: { type: String, index: true },
    amount: Number,
    sku: String,
    campaign: String,
    transactionId: String,
    parentTransactionId: String,
    created: { type: Number, default: Date.now },
  },
  { timestamps: true },
);

module.exports = db.db1.model("Gift", schema, "gifts");
