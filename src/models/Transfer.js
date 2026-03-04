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
    senderCountryCode: String,
    receiverId: String,
    receiverPhoneNumber: { type: String, index: true },
    receiverCountryCode: String,
    receiverCarrier: String,
    transferType: Number,
    sku: String,
    productName: String,
    paymentMethodType: Number,
    paymentMethodName: String,
    amount: Number,
    originalPrice: { countryCode: String, currency: String, value: Number },
    creditsAmount: Number,
    processingFee: Number,
    receiptEmail: String,
    message: String,
    status: Number,
    source: { type: String, default: "flom_v1" }, //flom_v1, flom
    created: { type: Number, default: Date.now },
    paymentProcessingInfo: {
      referenceId: String,
      code: String,
      message: String,
      payPalToken: String,
      payerId: String,
      payPalCanceled: Boolean,
      voided: Boolean,
      voidReferenceId: String,
      refunded: Boolean,
      refundReferenceId: String,
    },
    gift: { type: Boolean, default: false },
    testMode: { type: Boolean, default: false },
    void: { type: Boolean, default: false },
    senderIP: String,
    senderUUID: String,
    promotion: {
      id: String,
      amount: { type: Number, default: 0 },
      value: Number,
      type: { type: Number },
    },
    blessPacket: { id: String, title: String, amount: Number, emojiFileName: String },
    basket: [],
    multi: { type: Boolean, default: false }, // true for group payment
    requestTransferId: { type: String, default: null },
    isNigerianAPI: { type: Boolean, default: false },
    eligibleForPayout: { type: Boolean, default: false },
    payoutCompleted: { type: Boolean, default: false },
    membershipId: String,
    membershipPaymentType: Number,
    recurringPaymentId: String,
    operationId: String,
    airtimeOperationId: String,
    airtimeAPIRequest: {},
    airtimeAPIResponse: {},
    satsAmount: Number,
    localAmountSender: {},
    localAmountReceiver: {},
    bonusType: String,
    productId: String,
    feedbackId: String,
    liveStreamId: String,
    supportTicketId: String,
    linkedProductId: String,
    recommId: String,
    auctionId: String,
  },
  { timestamps: true },
);

module.exports = db.db1.model("Transfer", schema, "transfers");
