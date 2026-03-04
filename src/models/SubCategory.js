const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    mainCategoryId: { type: String, required: true },
    showYear: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = db.db1.model("SubCategory", schema, "sub_categories");
