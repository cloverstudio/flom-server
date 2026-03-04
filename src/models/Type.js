const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    subCategoryId: { type: String, required: true },
    genders: [String],
    sizes: [String],
    colors: [String],
    brands: [String],
  },
  { timestamps: true },
);

module.exports = db.db1.model("Type", schema, "types");
