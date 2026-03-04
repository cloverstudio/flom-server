const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    chatId: { type: String, index: true },
    note: { type: String, index: true },
    created: Number,
    modified: Number,
  },
  { timestamps: true },
);

module.exports = db.db1.model("Note", schema, "notes");
