const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    payoutMethodType: Number,
    receiverId: String,
    receiverName: String,
    receiverUserName: String,
    receiverPhoneNumber: String,
    receiverCurrency: String,
    receiverPaypalEmail: String,
    receiverBankAccount: { bankAccountNumber: String, bankCode: String, bankName: String },
    transferIds: [String],
    cashAmount: Number,
    creditsAmount: Number,
    creditsAmountInUSD: Number,
    bonusAmount: Number,
    totalAmount: Number,
    totalAmountWithFeeSubtracted: Number,
    amount: Number,
    localAmount: {
      cashAmount: Number,
      creditsAmountInLocalCurrency: Number,
      bonusAmount: Number,
      totalAmount: Number,
      totalAmountWithFeeSubtracted: Number,
    },
    processingFee: Number,
    localProcessingFee: { countryCode: String, currency: String, value: Number },
    source: { type: String, default: "flom_v1" },
    status: Number,
    created: { type: Number, default: Date.now },
    modifiedList: [
      {
        created: Number,
        adminId: String,
        adminUserName: String,
        oldStatus: Number,
        newStatus: Number,
        _id: false,
      },
    ],
    payoutAPIRequest: {},
    payoutAPIResponse: {},
    bonusType: String,
    operationId: String,
  },
  { timestamps: true },
);

module.exports = db.db1.model("Payout", schema, "payouts");
