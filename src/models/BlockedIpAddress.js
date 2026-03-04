const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  { ipAddress: String, created: { type: Number, default: Date.now } },
  { timestamps: true },
);

module.exports = db.db1.model("BlockedIpAddress", schema, "blocked_ip_addresses");
