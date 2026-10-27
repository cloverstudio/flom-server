const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    type: String, // transfer, gifting
    name: String,
    value: Number,
    valueText: String,
    valueBoolean: Boolean,
    valueArray: Array,
    properties: {},
    description: String,
    created: { type: Number, default: Date.now },
  },
  { timestamps: true },
);

const Configuration = db.db2.model("Configuration", schema, "configurations");

const ExtendedConfiguration = class extends Configuration {
  static async checkFloodDetectionWhiteList(phoneNumber) {
    if (!phoneNumber) {
      throw new Error("Phone number is required");
    }

    const c = await this.exists({ type: "floodDetectionWhiteList", valueArray: phoneNumber });

    return !!c;
  }
};

module.exports = ExtendedConfiguration;
