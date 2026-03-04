const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  { countryCode: { type: String, unique: true }, message: String },
  { timestamps: true },
);

module.exports = db.db1.model("InviteMessage", schema, "invite_messages");
