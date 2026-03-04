const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    userId: { type: String, index: true },
    messageId: { type: String, index: true },
    roomId: { type: String, index: true },
    created: Number,
  },
  { timestamps: true },
);

module.exports = db.db1.model("Favorite", schema, "favorites");
