const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    name: { type: String, index: true },
    sortName: { type: String, index: true },
    description: { type: String, index: true },
    created: Number,
    avatar: {
      picture: { originalName: String, size: Number, mimeType: String, nameOnServer: String },
      thumbnail: { originalName: String, size: Number, mimeType: String, nameOnServer: String },
    },
    organizationId: { type: String, index: true },
    users: [String],
    parentId: { type: String, index: true },
    type: Number, // 1: Group, 2: Department
    default: Boolean, // default department when new organization is created
  },
  { timestamps: true },
);

module.exports = db.db1.model("Group", schema, "groups");
