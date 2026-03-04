const { db } = require("#infra");
const mongoose = require("mongoose");
const { Config } = require("#config");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    countryCode: String,
    name: String,
    iban: String,
    code: String,
    institutionCode: String,
    accountNumber: String,
    routingNumber: String,
    created: { type: Number, default: Date.now },
    modified: { type: Number, default: Date.now },
    logoFileName: { type: String, default: "" },
  },
  { timestamps: true },
);

schema.post("findOne", function (docs) {
  if (docs.logoFileName?.length > 0) {
    docs.logoUrl = `${Config.webClientUrl}/api/v2/payment-methods/get-logo/${docs.logoFileName}`;
  } else {
    docs.logoUrl = `${Config.webClientUrl}/api/v2/payment-methods/get-logo/default-image.png`;
  }
  return docs;
});

schema.post("find", function (docs) {
  if (docs && docs.length > 0) {
    docs.forEach((doc) => {
      if (doc.logoFileName?.length > 0) {
        doc.logoUrl = `${Config.webClientUrl}/api/v2/payment-methods/get-logo/${doc.logoFileName}`;
      } else {
        doc.logoUrl = `${Config.webClientUrl}/api/v2/payment-methods/get-logo/default-image.png`;
      }
    });
  }
  return docs;
});

module.exports = db.db1.model("Bank", schema, "banks");
