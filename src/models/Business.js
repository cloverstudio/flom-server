const { db } = require("#infra");
const { businessTags } = require("#config");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    name: String,
    description: String,
    avatar: {},
    status: { type: String, default: "created" }, // created, active_payout_disabled, active_payout_enabled, disabled
    oldStatus: String,
    owner: {
      _id: { type: String, index: true },
      phoneNumber: { type: String, index: true },
    },
    address: {},
    assistants: [
      {
        _id: String,
        phoneNumber: String,
        role: String, // role - helper (chat, job status, evidence no money), manager (+ prices, refunds, profile edits) | status - invited, active, disabled
        status: String, // pending, accepted, rejected, revoked, expired
        invitedById: String,
        invitedAt: Number,
        expiresAt: Number,
        respondedAt: Number,
        revokedAt: Number,
      },
    ],
    phoneNumber: { type: String, index: true },
    whatsAppPhoneNumber: String,
    whatsAppConnected: { type: Boolean, default: false },
    taxId: String,
    idPhotos: {},
    verificationStatus: { type: String, default: "unverified" }, // unverified | pending | verified | rejected | expired
    schedule: {
      description: String,
      weekly: {
        0: { enabled: Boolean, periods: [{ _id: false, start: Number, end: Number }] }, // Sunday
        1: { enabled: Boolean, periods: [{ _id: false, start: Number, end: Number }] }, // Monday
        2: { enabled: Boolean, periods: [{ _id: false, start: Number, end: Number }] },
        3: { enabled: Boolean, periods: [{ _id: false, start: Number, end: Number }] },
        4: { enabled: Boolean, periods: [{ _id: false, start: Number, end: Number }] },
        5: { enabled: Boolean, periods: [{ _id: false, start: Number, end: Number }] },
        6: { enabled: Boolean, periods: [{ _id: false, start: Number, end: Number }] }, // Saturday
      },
      exceptions: [
        {
          _id: false,
          date: String,
          enabled: Boolean,
          periods: [{ start: Number, end: Number }],
          description: String,
        },
      ],
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
