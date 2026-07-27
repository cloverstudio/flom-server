const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    chainId: String,
    subChainId: String,
    businessId: String,
    outletId: String,
    terminalId: String,
    userId: String,
    startTimeStamp: Number,
    endTimeStamp: Number,
    created: { type: Number, default: Date.now, index: true },
  },
  { timestamps: true },
);

module.exports = db.db1.model("TerminalOperatorReference", schema, "terminal_operator_references");
