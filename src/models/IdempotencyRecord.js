const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    // userId: { type: String, required: true }, // scope per user
    route: { type: String, required: true }, // e.g. "POST /orders/:id/deliver"
    requestHash: { type: String, required: true }, // hash of the body, to detect mismatched replays
    status: { type: String, enum: ["processing", "completed"], default: "processing" },
    statusCode: Number,
    responseBody: mongoose.Schema.Types.Mixed,
    created: { type: Number, default: Date.now, index: true },
    expiration: { type: Date, default: Date.now, index: { expires: "48h" } },
  },
  { timestamps: true },
);

schema.index({ key: 1, route: 1 }, { unique: true });

module.exports = db.db1.model("IdempotencyRecord", schema, "idempotency_records");
