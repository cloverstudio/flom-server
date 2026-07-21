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
    token: String,
    smsSent: { type: Boolean, default: false },
    created: { type: Number, default: Date.now, index: true },
  },
  { timestamps: true },
);

module.exports = db.db1.model("BusinessInvite", schema, "business_invites");
