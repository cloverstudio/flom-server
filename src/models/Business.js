const { db } = require("#infra");
const { businessTags } = require("#config");
const mongoose = require("mongoose");

const tagMap = {};
businessTags.forEach((tag) => {
  tagMap[tag.id] = tag;
});

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    chainId: String,
    subChainId: String,
    name: String,
    description: String,
    avatar: {},
    payoutStatus: { type: String, default: "disabled" }, // disabled, enabled
    idStatus: { type: String, default: "unverified" }, // unverified, pending, verified, rejected, expired
    idRejectionReason: String,
    owner: {
      _id: { type: String, index: true },
      phoneNumber: { type: String, index: true },
    },
    created: { type: Number, default: Date.now, index: true },
    lastActive: { type: Number, default: Date.now, index: true },
    market: String,
    tagIds: [String],
  },
  { timestamps: true },
);

schema.post(/.+/, function (docs, next) {
  runTransform(docs);
  next();
});

function runTransform(docOrDocs) {
  if (docOrDocs) {
    const docs = Array.isArray(docOrDocs) ? docOrDocs : [docOrDocs];

    docs.forEach((doc) => {
      if (doc.tagIds && Array.isArray(doc.tagIds) && doc.tagIds.length > 0) {
        doc.tags = doc.tagIds.map((t) => {
          const tagData = tagMap[t];

          return {
            id: t,
            display: tagData ? tagData.display : null,
            enabledInMarket:
              !tagData || !tagData.markets || !Array.isArray(tagData.markets)
                ? false
                : tagData.markets.includes(doc.market),
          };
        });
      }

      if (doc.payoutStatus && doc.idStatus) {
        const ps = doc.payoutStatus.toLowerCase();
        const is = doc.idStatus.toLowerCase();

        if (ps === "enabled" && is === "verified") {
          doc.status = "active_payout_enabled";
        } else if (ps === "disabled" && (is === "pending" || is === "verified")) {
          doc.status = "active_payout_disabled";
        } else {
          doc.status = "created";
        }
      }
    });
  }
}

module.exports = db.db1.model("Business", schema, "businesses");
