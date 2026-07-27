const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    businessId: String,
    chainId: String,
    subChainId: String,
    name: String,
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] },
    },
    address: {},
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

module.exports = db.db1.model("Outlet", schema, "outlets");
