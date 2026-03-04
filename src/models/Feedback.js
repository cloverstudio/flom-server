const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    userId: { type: String, index: true },
    data: [{ question: String, answer: [String], rate: Number }],
    created: { type: Number, default: Date.now },
    operationId: String,
    airtimeAPIResponse: {},
    sentGift: { type: Number, default: 2 }, // 0 - airtime already sent, 1 - airtime sent, -1 - airtime not supported, 2 - no airtime
  },
  { timestamps: true },
);

module.exports = db.db1.model("Feedback", schema, "feedbacks");
