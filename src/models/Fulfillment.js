const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    transferId: String,
    groupTransferId: String,
    operationId: String,
    airtimeOperationId: String,
    senderId: String,
    receiverPhoneNumber: String,
    receiversPhoneNumbers: [String],
    paymentAPIRequest: {},
    paymentAPIResponse: {},
    paymentAPICallback: {},
    airtimeAPIRequest: {},
    airtimeAPIResponse: {},
    airtimeAPICallback: {},
    created: { type: Number, default: Date.now },
    status: String,
    source: { type: String, default: "flom_v1" }, //flom_v1, flom
    unknownReceiptRetryCount: { type: Number, default: 0 },
    airtimeRetryCount: { type: Number, default: 0 },
    gift: { type: Boolean, default: false },
    amount: Number,
    giftingSession: Number,
    alreadyCalled: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = db.db1.model("Fulfillment", schema, "fulfillments");
