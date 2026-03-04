const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    name: String,
    itemsCount: { type: Number, default: 0 },
    image: {
      id: mongoose.Schema.Types.ObjectId,
      originalFileName: String,
      nameOnServer: String,
      mimeType: String,
      aspectRatio: Number,
      width: Number,
      height: Number,
    },
    aspectRatio: Number,
    created: { type: Number, default: Date.now },
    modified: { type: Number, default: Date.now },
    items: [
      {
        _id: mongoose.Schema.Types.ObjectId,
        name: String,
        bigImage: {
          id: mongoose.Schema.Types.ObjectId,
          originalFileName: String,
          nameOnServer: String,
          mimeType: String,
          aspectRatio: Number,
          width: Number,
          height: Number,
        },
        smallImage: {
          id: mongoose.Schema.Types.ObjectId,
          originalFileName: String,
          nameOnServer: String,
          mimeType: String,
          aspectRatio: Number,
          width: Number,
          height: Number,
        },
        aspectRatio: Number,
        animate: Boolean,
        created: { type: Number, default: Date.now },
        modified: { type: Number, default: Date.now },
        isDeprecated: { type: Boolean, default: false },
      },
    ],
    isDefault: Boolean,
    isDeprecated: { type: Boolean, default: false },
    countryCode: { type: String, default: null },
  },
  { timestamps: true },
);

schema.index({ name: 1 });

module.exports = db.db1.model("EmojiSet", schema, "emoji_sets");
