const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    type: Number, // 1 - monthly membership with charging upfront
    userId: String,
    status: Number, // 1 - active, 2 - pending cancel, 3 - canceled, 4 - declined
    paymentMethodType: Number,
    amount: Number,
    intervalLength: Number, // days: 7 - 365, months: 1 - 12
    intervalUnit: String, // days or months
    source: { type: String, default: "flom_v1" }, //flom_v1, flom
    transfers: [], // Array of transfer ids and transferProcessingInfo (initial upfront charge, upgrading plans, etc.)
    subscriptionStartDate: String,
    subscriptionId: String, //authorize.net subscription id
    subscriptionProcessingInfo: { referenceId: String, code: String, message: String },
    created: { type: Number, default: Date.now },
    membership: {
      currentId: String,
      currentExpiration: { type: Number, default: -1 }, // membership expiration date, -1 if it wasn't downgraded
      newId: String,
    },
  },
  { timestamps: true },
);

module.exports = db.db1.model("RecurringPayment", schema, "recurring_payments");
