const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    name: String,
    description: String,
    category: { _id: String, name: String },
    avatar: {},
    status: { type: String, default: "created" }, // created, active_payout_disabled, active_payout_enabled, disabled
    oldStatus: String,
    owner: {
      _id: { type: String, index: true },
      phoneNumber: { type: String, index: true },
    },
    address: {},
    assistants: [{ _id: String, phoneNumber: String, role: String, status: String }], // role - helper (chat, job status, evidence no money), manager (+ prices, refunds, profile edits) | status - invited, active, disabled
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
  },
  { timestamps: true },
);

module.exports = db.db1.model("Business", schema, "businesses");
