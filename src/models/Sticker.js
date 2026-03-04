const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    name: String,
    sortName: String,
    description: String,
    created: Number,
    pictures: [],
    type: Number, // 1: Owner, 2: Admin
    organizationId: { type: String, index: true },
  },
  { timestamps: true },
);

module.exports = db.db1.model("Sticker", schema, "stickers");
