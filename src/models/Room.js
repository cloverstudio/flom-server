const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    users: [],
    owner: { type: String, index: true },
    admins: [String],
    organizationId: { type: String, index: true },
    name: { type: String, index: true },
    description: String,
    created: { type: Number, default: Date.now },
    modified: { type: Number, default: Date.now },
    lastMessage: {},
    type: Number, // 1:Private 2:Group 3:Public
    tribeRoom: Number, // 1 - chat is for tribes
    tribeId: String, // exists if tribeRoom is 1
    avatar: {
      picture: {
        originalName: String,
        size: Number,
        mimeType: String,
        nameOnServer: String,
      },
      thumbnail: {
        originalName: String,
        size: Number,
        mimeType: String,
        nameOnServer: String,
      },
    },
    ownerRemoved: Boolean,
  },
  { timestamps: true },
);

module.exports = db.db1.model("Room", schema, "rooms");
