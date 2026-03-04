const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    phoneNumber: String,
    isReserved: { type: Boolean, default: false },
    modified: { type: Number, default: Date.now },
    countryCode: String,
  },
  { timestamps: true },
);

module.exports = db.db1.model("DidWWNumber", schema, "didww_numbers");
