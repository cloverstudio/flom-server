const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    businessId: String,
    userId: String,
    phoneNumber: String,
    firstName: String,
    lastName: String,
    role: String, // role - helper, manager
    status: String, // pending, accepted, rejected, revoked, expired
    invitedById: String,
    invitedAt: Number,
    expiresAt: Number,
    respondedAt: Number,
    revokedAt: Number,
    created: { type: Number, default: Date.now, index: true },
    notifications: {
      seen: { type: Boolean, default: false },
      inAppNotificationSentAt: { type: Number, default: 0 },
      inAppNotificationSeenAt: { type: Number, default: 0 },
      inAppNotificationId: String,
      inAppMessageSentAt: { type: Number, default: 0 },
      inAppMessageSeenAt: { type: Number, default: 0 },
      inAppMessageId: String,
      waSentAt: { type: Number, default: 0 },
      waSeenAt: { type: Number, default: 0 },
      waFailed: { type: Boolean, default: false },
      waMessageId: String,
      smsSentAt: { type: Number, default: 0 },
      smsSeenAt: { type: Number, default: 0 },
      smsMessageId: String,
    },
  },
  { timestamps: true },
);

module.exports = db.db1.model("BusinessInvite", schema, "business_invites");
