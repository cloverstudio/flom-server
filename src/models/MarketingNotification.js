const { db } = require("#infra");
const mongoose = require("mongoose");
const { Const } = require("#config");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    title: String,
    text: String,
    notificationType: { type: Number, default: Const.notificationTypeMarketing },
    senderId: String,
    allSubscribers: Number, // 0 - false, 1 - true
    receivers: [String],
    contentType: Number, // 1 - video, 2 - video story, 3 - podcast, 4 - text story, 5 - product, 6 - profile, 7 - marketplace
    contentId: String,
    contentName: String,
    created: { type: Number, default: Date.now },
  },
  { timestamps: true },
);

module.exports = db.db1.model("MarketingNotification", schema, "marketing_notifications");
