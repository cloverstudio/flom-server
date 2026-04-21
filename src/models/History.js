const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    userId: { type: String, index: true },
    chatId: { type: String, index: true },
    chatType: { type: Number, index: true },
    lastUpdate: { type: Number, index: true },
    lastUpdateUnreadCount: { type: Number, sparse: true },
    lastUpdateUser: {},
    lastMessage: {},
    unreadCount: Number,
    keyword: String,
    pinned: Boolean,
    ownerRemoved: { type: Boolean, sparse: true },
    firstMessageUserId: { type: String, index: false },
    reaction: {},
    channel: String, // internal, whatsapp
  },
  { timestamps: true },
);

module.exports = db.db1.model("History", schema, "histories");
