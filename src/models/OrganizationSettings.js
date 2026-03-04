const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    organizationId: { type: String, index: true },
    allowMultipleDevice: { type: Number },
  },
  { timestamps: true },
);

module.exports = db.db1.model("OrganizationSettings", schema, "organization_settings");
