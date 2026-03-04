const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    name: String,
    description: String,
    ownerId: { type: String, index: true },
    image: {
      originalName: String,
      size: Number,
      mimeType: String,
      nameOnServer: String,
      link: String,
      thumbnailName: String,
    },
    members: { accepted: [], declined: [], requested: [], invited: [] },
    roomId: String, //id of the tribe group chat
    isHidden: { type: Boolean, default: false },
    created: { type: Number, default: Date.now },
  },
  { timestamps: true },
);

module.exports = db.db1.model("Tribe", schema, "tribes");
