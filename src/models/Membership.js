const { db } = require("#infra");
const mongoose = require("mongoose");
const { Const } = require("#config");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    name: String,
    amount: Number,
    description: String,
    recurringPaymentType: { type: Number, default: Const.recurringPaymentTypeMonthlyUpfront },
    benefits: [], //{"type": 1, "title": "Group chat", "enabled": true}
    order: Number,
    creatorId: String,
    image: {
      originalName: String,
      size: Number,
      mimeType: String,
      nameOnServer: String,
      link: String,
      thumbnailName: String,
    },
    created: { type: Number, default: Date.now },
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = db.db1.model("Membership", schema, "memberships");
