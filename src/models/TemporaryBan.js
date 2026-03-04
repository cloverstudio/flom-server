const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    phoneNumber: { type: String, index: true },
    duration: Number,
    created: { type: Number, default: Date.now },
  },
  { timestamps: true },
);

module.exports = db.db1.model("TemporaryBan", schema, "temporary_bans");
