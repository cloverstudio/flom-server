const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    userId: { type: String, index: true },
    type: Number,
    slug: { type: String, index: true },
    used: { type: Boolean, default: false },
    phoneNumber: { type: String, index: true },
    ref: String,
    shouldSendWelcomeMessage: { type: Boolean, default: true },
    message: String,
    created: { type: Number, default: Date.now },
  },
  { timestamps: true },
);

module.exports = db.db1.model("RegistrationLink", schema, "registration_links");
