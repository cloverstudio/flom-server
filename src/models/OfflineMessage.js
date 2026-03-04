const { db } = require("#infra");
const mongoose = require("mongoose");
const { Const } = require("#config");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    roomID: String,
    userID: String,
    userPhoneNumber: String,
    receiverID: String,
    receiverPhoneNumber: String,
    sessionId: { type: String, index: true },
    message: { type: String, default: "" },
    plainTextMessage: { type: Boolean, default: true },
    type: { type: Number, default: Const.messageTypeText },
    sent: { type: Boolean, default: false },
    receiverUserIsNew: { type: Boolean, default: false },
    senderUserIsNew: { type: Boolean, default: false },
    attributes: {},
  },
  { timestamps: true },
);

module.exports = db.db1.model("OfflineMessage", schema, "offline_message");
