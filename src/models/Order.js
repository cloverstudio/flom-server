const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    price: { countryCode: String, currency: String, value: Number, valueInSats: Number },
    products: [{ _id: String, name: String, condition: String, quantity: Number, file: {} }],
    seller: {
      _id: String,
      name: String,
      userName: String,
      phoneNumber: String,
      created: Number,
      avatar: {},
    },
    buyer: {
      _id: String,
      name: String,
      userName: String,
      phoneNumber: String,
      created: Number,
      avatar: {},
    },
    auctionId: String,
    transferId: String,
    paymentMethod: String,
    status: { type: String, default: "payment_pending" },
    supportTicketId: String,
    supportReason: String,
    expirationDate: Number,
    shipByDate: Number,
    shippedAt: Number,
    overdue: { type: Boolean, default: false },
    deliveredAt: Number,
    shipping: {
      origin: {
        name: String,
        country: String,
        countryCode: String,
        region: String,
        regionCode: String,
        city: String,
        road: String,
        houseNumber: String,
        postCode: String,
        isDefault: Boolean,
      },
      destination: {
        name: String,
        country: String,
        countryCode: String,
        region: String,
        regionCode: String,
        city: String,
        road: String,
        houseNumber: String,
        postCode: String,
        isDefault: Boolean,
      },
      provider: String,
      trackingNumber: String,
      files: [],
    },
    events: [{ status: String, user: String, userId: String, timeStamp: Number }],
    created: { type: Number, default: Date.now, index: true },
    modified: { type: Number, default: Date.now, index: true },
  },
  { timestamps: true },
);

module.exports = db.db1.model("Order", schema, "orders");
