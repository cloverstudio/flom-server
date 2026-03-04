const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    type: Number,
    name: String,
    fee: { percent: Number, flat: Number },
    disabled: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = db.db1.model("PaymentMethod", schema, "payment_methods");
