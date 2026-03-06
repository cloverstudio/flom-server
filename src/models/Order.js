const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    price: { countryCode: String, currency: String, value: Number, valueInSats: Number },
    products: [{ _id: String, name: String, condition: String, quantity: Number, file: {} }],
    sellerId: String,
    buyerId: String,
    auctionId: String,
    transferId: String,
    paymentMethod: String,
    status: { type: String, default: "payment_pending" },
    quantity: Number,
    supportTicketId: String,
    supportReason: String,
    shipBy: Number,
    shippedAt: Number,
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
      files: [
        {
          nameOnServer: String,
          mimeType: String,
          type: String,
          size: Number,
          width: Number,
          height: Number,
          thumbnail: {
            nameOnServer: String,
            mimeType: String,
            size: Number,
            width: Number,
            height: Number,
          },
        },
      ],
    },
    events: [{ status: String, user: String, userId: String, timeStamp: Number }],
    created: { type: Number, default: Date.now, index: true },
    modified: { type: Number, default: Date.now, index: true },
  },
  { timestamps: true },
);

module.exports = db.db1.model("Order", schema, "orders");
