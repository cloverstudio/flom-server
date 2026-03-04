const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    title: String,
    amount: Number,
    creditsAmount: Number,
    emoji: {
      originalFileName: String,
      nameOnServer: String,
      mimeType: String,
      size: Number,
      height: Number,
      width: Number,
    },
    emojiFileName: String,
    smallEmoji: {
      originalFileName: String,
      nameOnServer: String,
      mimeType: String,
      size: Number,
      height: Number,
      width: Number,
    },
    smallEmojiFileName: String,
    position: Number,
    isDeleted: { type: Boolean, default: false },
    keywords: { type: String, default: null },
    created: { type: Number, default: Date.now },
  },
  { timestamps: true },
);

module.exports = db.db1.model("BlessPacket", schema, "bless_packets");
