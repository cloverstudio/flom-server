const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    outletId: String,
    businessId: String,
    chainId: String,
    subChainId: String,
    paymentAddress: String,
    isActive: { type: Boolean, default: false },
    isMainTerminal: { type: Boolean, default: false },
    created: { type: Number, default: Date.now, index: true },
  },
  { timestamps: true },
);

module.exports = db.db1.model("Terminal", schema, "terminals");
