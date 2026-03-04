const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    countryCode: String,
    paymentMethodType: Number,
    transferType: Number,
    base: { fixed: Number, percent: Number },
    max: { type: Number, default: -1 },
    additional: { fixed: Number, percent: Number },
    created: { type: Number, default: Date.now },
    modified: { type: Number, default: Date.now },
  },
  { timestamps: true },
);

module.exports = db.db1.model("Fee", schema, "fees");
