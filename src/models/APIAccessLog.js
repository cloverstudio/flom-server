const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    type: String,
    api: String,
    userName: String,
    body: {},
    headers: {},
    created: Number,
    createdDate: Date,
    createdReadable: String,
  },
  { timestamps: true },
);

module.exports = db.db1.model("APIAccessLog", schema, "api_access_logs");
