const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    phoneNumber: String,
    reason: String,
    direction: Number,
    userId: String,
    created: {
      type: Number,
      default: Date.now,
    },
    createdReadable: String,
  },
  { timestamps: true },
);

module.exports = db.db2.model("BannedNumber", schema, "banned_numbers");
