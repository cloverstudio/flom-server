const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    name: { type: String, index: { unique: true } },
  },
  { timestamps: true },
);

module.exports = db.db1.model("Size", schema, "sizes");
