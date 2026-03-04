const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    name: String,
    parentId: {
      type: String,
      index: true,
    },
    group: [Number], // 1 - all, 2 - creators, 3 - merchants, 11 - video, 12 - video story, 13 - podcast, 14 - text story, 15 - product
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = db.db1.model("Category", schema, "categories");
