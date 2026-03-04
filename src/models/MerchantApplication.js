const { db } = require("#infra");
const mongoose = require("mongoose");
const { Const } = require("#config");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    userId: String,
    username: String,
    phoneNumber: String,
    firstName: String,
    lastName: String,
    dateOfBirth: String,
    streetName: String,
    streetNumber: String,
    city: String,
    zip: String,
    paypalEmail: String,
    paypalAmountSent: Number,
    paypalAmountReceived: Number,
    taxIN: Number,
    bankName: String,
    bankCountry: String,
    bankAccountNumber: String,
    bankCode: String,
    routingNumber: Number,
    idPhotos: [],
    merchantCode: String,
    approvalStatus: { type: Number, default: Const.merchantApplicationStatusPending },
    approvalComment: String,
    created: { type: Number, default: Date.now },
  },
  { timestamps: true },
);

module.exports = db.db1.model("MerchantApplication", schema, "merchant_applications");
