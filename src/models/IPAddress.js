const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    IP: String,
    countryCode: String,
    isVPN: Boolean,
    latitude: Number,
    longitude: Number,
    modified: { type: Number, default: Date.now },
  },
  { timestamps: true },
);

module.exports = db.db1.model("IPAddress", schema, "ip_addresses");
