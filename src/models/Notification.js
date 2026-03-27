const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    title: String,
    text: String,
    referenceId: String,
    relatedNotificationId: String,
    receiverIds: [String],
    senderId: String,
    notificationType: Number,
    notificationSubType: Number,
    created: { type: Number, default: Date.now },
    status: Number,
    offerStatus: String,
  },
  { timestamps: true },
);

module.exports = db.db1.model("Notification", schema, "notifications");
