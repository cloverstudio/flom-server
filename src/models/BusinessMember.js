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
    role: String, // role - owner, helper, manager
    status: String, // invited, active, inactive, removed
    inviteId: String,
    created: { type: Number, default: Date.now, index: true },
  },
  { timestamps: true },
);

module.exports = db.db1.model("BusinessMember", schema, "business_members");
