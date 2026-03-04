const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    userId: String,
    tag: String,
    interactions: Number, // view = 1, like = 3
    created: { type: Number, default: Date.now },
    modified: { type: Number, default: Date.now },
  },
  { timestamps: true },
);

module.exports = db.db1.model("UserTagInteraction", schema, "user_tag_interactions");
