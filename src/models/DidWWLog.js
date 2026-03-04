const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    sourcePhoneNumber: { type: String, required: true },
    destinationPhoneNumber: { type: String, required: true },
    created: { type: Number, default: Date.now },
  },
  { timestamps: true },
);

module.exports = db.db1.model("DidWWLog", schema, "didww_logs");
