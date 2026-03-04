const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    username: String,
    password: String,
    role: Number, // 900 - admin, 1000 - super admin
    token: { token: String, generatedAt: Number },
    email: String,
    emailVerification: {
      verified: { type: Boolean, default: false },
      code: String,
      token: String,
      emailOut: String,
    },
    twoFactorAuth: {
      tempToken: String,
      tokenGeneratedAt: Number,
      smsCode: String,
      smsTry: Number,
      smsOut: Number,
    },
    passwordReset: {
      token: String,
      tokenGeneratedAt: Number,
      completed: { type: Boolean, default: false },
    },
    firstName: String,
    lastName: String,
    phoneNumber: String,
    bvn: String,
    address: String,
    socialMedia: [],
    created: {
      type: Number,
      default: Date.now,
    },
  },
  { timestamps: true },
);

module.exports = db.db2.model("AdminPageUser", schema, "admin_page_users");
