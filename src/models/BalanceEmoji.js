const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    limit: Number,
    emoji: {
      originalFileName: String,
      nameOnServer: String,
      mimeType: String,
      size: Number,
      height: Number,
      width: Number,
    },
    created: { type: Number, default: Date.now },
  },
  { timestamps: true },
);

module.exports = db.db1.model("BalanceEmoji", schema, "balance_emojis");
