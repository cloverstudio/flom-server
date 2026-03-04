const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    name: String,
    sortName: String,
    created: Number,
    maxUserNumber: Number,
    maxGroupNumber: Number,
    maxRoomNumber: Number,
    diskQuota: Number,
    status: Number, // 1: Enabled, 0: Disabled
    organizationId: { type: String, index: true },
    logo: {
      picture: { originalName: String, size: Number, mimeType: String, nameOnServer: String },
      thumbnail: { originalName: String, size: Number, mimeType: String, nameOnServer: String },
    },
    email: String,
    diskUsage: Number, // in bytes
  },
  { timestamps: true },
);

module.exports = db.db1.model("Organization", schema, "organizations");
