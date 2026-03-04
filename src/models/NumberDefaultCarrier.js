const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  { phoneNumber: String, carrier: String, modified: Number },
  { timestamps: true },
);

module.exports = db.db2.model("NumberDefaultCarrier", schema, "number_default_carriers");
