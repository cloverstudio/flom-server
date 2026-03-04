const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    userId: String,
    productId: String,
    categoryId: String,
    created: { type: Number, default: Date.now },
  },
  { timestamps: true },
);

schema.index({ productId: 1, created: 1 });

module.exports = db.db1.model("ViewForYou", schema, "viewforyous");
