const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    normalizedName: { type: String, required: true },
    count: { type: Number, required: true },
    created: { type: Number, default: Date.now },
  },
  { timestamps: true },
);

schema.index({ name: "text" });
schema.index({ normalizedName: "text" });

module.exports = db.db1.model("FlomTag", schema, "flom_tags");
