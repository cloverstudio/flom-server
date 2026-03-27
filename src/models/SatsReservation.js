const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    userId: String,
    reservationType: String,
    value: Number,
    referenceId: String,
    isActive: { type: Boolean, default: true },
    created: { type: Number, default: Date.now, index: true },
  },
  { timestamps: true },
);

module.exports = db.db1.model("SatsReservation", schema, "sats_reservations");
