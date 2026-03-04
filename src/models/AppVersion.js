const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    iosBuildVersion: String,
    androidBuildVersion: String,
    iosOptional: String,
    androidOptional: String,
    iosText: String,
    androidText: String,
  },
  { timestamps: true },
);

module.exports = db.db1.model("AppVersion", schema, "app_version");
