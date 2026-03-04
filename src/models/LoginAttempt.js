const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    phoneNumber: { type: String, index: true },
    UUID: { type: String, index: true },
    deviceName: String,
    pushToken: String,
    oldPushTokens: [String],
    smsCode: String,
    ussdCode: String,
    email: String,
    description: String,
    location: String,
    smsOut: Number,
    ussdOut: Number,
    phoneNumbersOnDevice: [String],
    verified: { type: Boolean, default: false },
    requestedLogin: { type: Boolean, default: false },
    permissionFromOldDevice: { type: Boolean, default: false },
    completed: { type: Boolean, default: false },
    supportNeeded: { type: Boolean, default: false },
    supportApproved: { type: Boolean, default: false },
    created: { type: Number, default: Date.now },
    tempToken: String,
    modified: Number,
  },
  { timestamps: true },
);

module.exports = db.db1.model("LoginAttempt", schema, "login_attempts");
