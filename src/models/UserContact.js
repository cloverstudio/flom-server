const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    userId: { type: String, index: true },
    contactId: { type: String, index: true },
    name: String,
  },
  { timestamps: true },
);

module.exports = db.db1.model("UserContact", schema, "user_contacts");
