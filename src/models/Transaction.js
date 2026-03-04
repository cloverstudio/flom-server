const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    operationId: { type: String, sparse: true },
    merchantCode: String,
    customerMsisdn: String,
    customerEmail: String,
    amount: Number,
    amountInUSD: Number,
    multi: { type: Boolean, default: false, index: true },
    created: { type: Number, default: Date.now },
    completed: { type: Boolean, default: false, index: true },
    quantity: { type: Number, default: 1 },
    senderId: { type: String, index: true },
    receiverId: { type: String, index: true },
    receivers: [],
    roomID: String,
    productId: { type: String, sparse: true },
    description: String,
    serverResponse: [],
    callbackResponse: {},
    airtimeCallbackResponse: {},
    airtimeOperationId: { type: String, sparse: true },
    airtimeAPIResponse: {},
    receiptMessageId: String,
    type: { type: Number }, // 1 product, 2 merchant (cash), 3 airtime, 4 data
    paymentType: Number, // 1 - airtime, 2 - cash. 4 - data
    unknownReceiptSent: Boolean,
    unknownReceiptRetryCount: Number,
    receiverHasApp: { type: Boolean, default: true },
    status: { type: Number, default: 0 }, // 0 - processing, 1 - completed, 2 - failure
    airtimeRetryCount: { type: Number, default: 0 },
    sku: String,
    dataProductName: String,
    dataProducts: [],
    isMTNData: { type: Boolean, default: false },
    isPayPal: { type: Boolean, default: false },
    gift: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = db.db1.model("Transaction", schema, "transactions");
