const { db } = require("#infra");
const mongoose = require("mongoose");
const { Const } = require("#config");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    organizationId: { type: String, index: true },
    key: { type: String, index: true },
    url: { type: String, index: true },
    state: Number,
    created: Number,
  },
  { timestamps: true },
);

module.exports = db.db1.model("Webhook", schema, "webhooks");
