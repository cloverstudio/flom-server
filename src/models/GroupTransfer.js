const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    senderType: String,
    senderId: { type: String, index: true },
    senderPhoneNumber: { type: String, index: true },
    receivers: [
      {
        phoneNumber: String,
        countryCode: String,
        sku: String,
        amount: Number,
        transferId: String,
      },
    ],
    transferType: Number,
    productName: String,
    paymentMethodType: Number,
    amount: Number,
    processingFee: Number,
    status: Number,
    receiptEmail: String,
    source: { type: String, default: "flom_v1" }, //flom_v1, flom
    created: { type: Number, default: Date.now },
    paymentProcessingInfo: {
      referenceId: String,
      code: String,
      message: String,
      payPalToken: String,
      payerId: String,
      payPalCanceled: Boolean,
    },
    senderIP: String,
    senderUUID: String,
    testMode: { type: Boolean, default: false },
    isNigerianAPI: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = db.db1.model("GroupTransfer", schema, "group_transfers");
