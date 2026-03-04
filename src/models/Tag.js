const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    count: { type: Number, required: true },
    created: { type: Number, default: Date.now },
  },
  { timestamps: true },
);

schema.index({ name: "text" });

module.exports = db.db1.model("Tag", schema, "flom_tags");
