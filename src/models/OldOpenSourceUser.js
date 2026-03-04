const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    userID: { type: String, index: true },
    name: String,
    avatarURL: String,
    token: String,
    tokenGeneratedAt: Number,
    created: Number,
  },
  { timestamps: true },
);

module.exports = db.db1.model("OldOpenSourceUser", schema, "spika_users");
