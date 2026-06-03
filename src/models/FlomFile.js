const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    name: String,
    mimeType: String,
    size: Number,
    created: { type: Number, default: Date.now },
    duration: Number,
    mediaProcessingInfo: { status: String, error: String },
  },
  { timestamps: true },
);

module.exports = db.db1.model("FlomFile", schema, "flom_files");
