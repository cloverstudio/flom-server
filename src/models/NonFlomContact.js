const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  { userId: { type: String, index: true }, hashedPhoneNumber: { type: String, index: true } },
  { timestamps: true },
);

module.exports = db.db1.model("NonFlomContact", schema, "non_flom_contacts");
