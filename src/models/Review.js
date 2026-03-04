const { db } = require("#infra");
const mongoose = require("mongoose");
const Utils = require("#utils");
const { Config } = require("#config");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    user_id: { type: String, index: true },
    product_id: { type: String, index: true },
    type: { type: Number, default: 1 }, // 1 - normal review, 2 - super bless review
    blessPacket: {},
    rate: Number,
    comment: String,
    created: { type: Number, default: Date.now },
    modified: Number,
    isDeleted: { type: Boolean, default: false },
    files: [
      {
        file: {
          originalName: String,
          nameOnServer: String,
          hslName: String,
          size: Number,
          mimeType: String,
          duration: Number,
          aspectRatio: Number,
        },
        thumb: {
          originalName: String,
          nameOnServer: String,
          size: Number,
          mimeType: String,
        },
        fileType: Number, // 0 - image, 1 - video, 2 - audio
        order: Number,
      },
    ],
  },
  { timestamps: true },
);

schema.post("findOne", function (docs) {
  if (docs && docs.blessPacket) {
    if (docs.blessPacket.emojiFileName.includes(".webp")) {
      docs.blessPacket.link = `${Config.webClientUrl}/api/v2/bless/emojis/${docs.blessPacket.emojiFileName}`;
    } else {
      docs.blessPacket.link = `${Config.webClientUrl}/api/v2/bless/emojis/${docs.blessPacket.emojiFileName}.webp`;
    }
  }

  if (docs && docs.comment) {
    docs.rawComment = docs.comment;
    docs.comment = Utils.hideBadWords(docs.comment);
  }

  return docs;
});

schema.post("find", function (docs) {
  if (docs && docs.length > 0) {
    docs.forEach((doc) => {
      if (doc && doc.blessPacket) {
        if (doc.blessPacket.emojiFileName.includes(".webp")) {
          doc.blessPacket.link = `${Config.webClientUrl}/api/v2/bless/emojis/${doc.blessPacket.emojiFileName}`;
        } else {
          doc.blessPacket.link = `${Config.webClientUrl}/api/v2/bless/emojis/${doc.blessPacket.emojiFileName}.webp`;
        }
      }

      if (doc && doc.comment) {
        doc.rawComment = doc.comment;
        doc.comment = Utils.hideBadWords(doc.comment);
      }

      return doc;
    });
  }
  return docs;
});

module.exports = db.db1.model("Review", schema, "reviews");
