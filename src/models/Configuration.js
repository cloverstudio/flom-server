const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    type: String, // transfer, gifting
    name: String,
    value: Number,
    valueText: String,
    valueBoolean: Boolean,
    valueArray: Array,
    properties: {},
    description: String,
    created: { type: Number, default: Date.now },
  },
  { timestamps: true },
);

module.exports = db.db2.model("Configuration", schema, "configurations");
