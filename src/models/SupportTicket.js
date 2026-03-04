const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    type: String, // login_issue, abuse_issue, transfer_issue, other, feedback, flom_team_support
    status: Number, // 1 - submitted, 2 - in progress, 3 - completed, 4 - supervisor requested, 5 - super admin requested
    email: String,
    description: String,
    userId: String,
    userPhoneNumber: String,
    referenceId: String,
    paypalEmail: String,
    bankCode: String,
    bankAccountNumber: String,
    created: {
      type: Number,
      default: Date.now,
    },
    error: { code: Number },
    files: [],
    mediaProcessingInfo: { status: String, error: String },
  },
  { timestamps: true },
);

module.exports = db.db1.model("SupportTicket", schema, "support_tickets");
