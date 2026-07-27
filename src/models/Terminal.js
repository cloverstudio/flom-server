const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    outletId: String,
    businessId: String,
    chainId: String,
    subChainId: String,
    paymentAddress: String,
    created: { type: Number, default: Date.now, index: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

schema.pre(/find/, function () {
  const query = this.getQuery();
  if (query.isDeleted === undefined) {
    query.isDeleted = false;
  }
});

module.exports = db.db1.model("Terminal", schema, "terminals");
