const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    source: String,
    reference: String,
    error: { name: String, message: String, stack: String },
    request: { method: String, path: String, body: {}, params: {}, query: {} },
    user: { _id: String, userName: String, phoneNumber: String },
    created: { type: Number, default: Date.now, index: true },
  },
  { timestamps: true },
);

module.exports = db.db1.model("UnexpectedError", schema, "unexpected_errors");
