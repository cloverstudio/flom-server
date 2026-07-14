const { db } = require("#infra");
const { businessTags } = require("#config");
const mongoose = require("mongoose");

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
    status: { type: String, default: "created" }, // created, active_payout_disabled, active_payout_enabled, disabled
    verificationStatus: { type: String, default: "unverified" }, // unverified | pending | verified | rejected | expired
    oldStatus: String,
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

// All query methods that return docs
schema.post(/^find/, function (docs, next) {
  runTransform(docs);
  next();
});

// Document save (covers .save() and .create())
schema.post("save", function (doc, next) {
  runTransform(doc);
  next();
});

// insertMany (bulk document creation)
schema.post("insertMany", function (docs, next) {
  runTransform(docs);
  next();
});

function runTransform(docOrDocs) {
  const docs = Array.isArray(docOrDocs) ? docOrDocs : [docOrDocs];

  const tagMap = {};
  businessTags.forEach((tag) => {
    tagMap[tag.id] = tag;
  });

  docs.forEach((doc) => {
    if (doc.tagIds && Array.isArray(doc.tagIds) && doc.tagIds.length > 0) {
      doc.tags = doc.tagIds.map((t) => {
        const tagData = tagMap[t];

        return {
          id: t,
          display: tagData ? tagData.display : null,
          enabledInMarket:
            !tagData.markets || !Array.isArray(tagData.markets)
              ? false
              : tagData.markets.includes(doc.market),
        };
      });
    }
  });
}

module.exports = db.db1.model("Business", schema, "businesses");
