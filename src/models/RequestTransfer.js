const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    requestReceiverId: String,
    requestReceiverPhoneNumber: String,
    requestSenderCountryCode: String,
    requestSenderPhoneNumber: String,
    requestSenderCarrier: String,
    carrierLogo: String,
    requestSenderUsername: String,
    transferType: Number,
    sku: String,
    productName: String,
    amount: Number,
    message: String,
    status: Number,
    source: { type: String, default: "flom_v1" }, //flom_v1, flom
    created: { type: Number, default: Date.now },
    multi: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = db.db1.model("RequestTransfer", schema, "request_transfers");
