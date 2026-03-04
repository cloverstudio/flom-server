const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    type: Number, // 1 - banned carrier
    phoneNumber: String,
    reason: String,
    blocked: { type: Boolean, default: true },
    created: { type: Number, default: Date.now },
  },
  { timestamps: true },
);

module.exports = db.db1.model("BlockedNumber", schema, "blocked_numbers");
