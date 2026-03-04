const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    sellerId: String,
    product: { _id: String, name: String, condition: String, file: {} },
    liveStreamId: String,
    minPrice: { countryCode: String, currency: String, value: Number, valueInSats: Number },
    quantity: { type: Number, default: 1 },
    bidIncrement: Number,
    duration: Number, // in seconds
    isSuddenDeath: { type: Boolean, default: false },
    startTimeStamp: Number,
    endTimeStamp: Number,
    status: { type: String, default: "inactive" },
    isActive: { type: Boolean, default: false },
    bids: [
      {
        _id: false,
        user: {
          _id: String,
          phoneNumber: String,
          userName: String,
          created: Number,
          avatar: {},
          paymentMethod: String,
        },
        timeStamp: Number,
        bid: { countryCode: String, currency: String, value: Number, valueInSats: Number },
      },
    ],
    winningBid: {
      user: {
        _id: String,
        phoneNumber: String,
        userName: String,
        created: Number,
        avatar: {},
        paymentMethod: String,
      },
      timeStamp: Number,
      bid: { countryCode: String, currency: String, value: Number, valueInSats: Number },
    },
    counterBidTime: Number,
    softCloseWindow: Number, // in seconds
    note: String,
    created: { type: Number, default: Date.now, index: true },
    modified: { type: Number, default: Date.now, index: true },
  },
  { timestamps: true },
);

module.exports = db.db1.model("Auction", schema, "auctions");
