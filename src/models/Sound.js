const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    title: String,
    artist: String,
    duration: String, // in seconds
    audio: {
      originalFileName: String,
      nameOnServer: String,
      mimeType: String,
      size: Number,
      duration: Number,
      hslName: String,
    },
    thumbnail: {
      originalFileName: String,
      nameOnServer: String,
      mimeType: String,
      size: Number,
      height: Number,
      width: Number,
      aspectRatio: Number,
    },
    created: Number,
    createdReadable: String,
    modified: Number,
    modifiedReadable: String,
    usedInExpoCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

module.exports = db.db1.model("Sound", schema, "sounds");
