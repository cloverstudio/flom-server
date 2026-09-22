const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    url: String,
    dataObject: {},
    dataArray: [],
    success: Boolean,
    created: { type: Number, default: Date.now, index: true },
    modified: { type: Number, default: Date.now, index: true },
  },
  { timestamps: true },
);

module.exports = db.db1.model("LocationRequestCache", schema, "location_request_cache");
