const { db } = require("#infra");
const mongoose = require("mongoose");
const { Const } = require("#config");

const Configuration = require("./Configuration");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    date: String,
    rates: {},
    created: { type: Number, default: Date.now },
    modified: { type: Number, default: Date.now },
  },
  { timestamps: true },
);

const ConversionRate = db.db1.model("ConversionRate", schema, "conversion_rates");

class ExtendedConversionRate extends ConversionRate {
  static async getRates(date) {
    const conversionRatesToday = (
      await this.find().sort({ date: -1, modified: -1 }).limit(1).lean()
    )[0];

    const specialConversionRates = await Configuration.find({
      type: Const.configurationTypeSpecialConversionRates,
    });

    if (specialConversionRates.length > 0) {
      for (let i = 0; i < specialConversionRates.length; i++) {
        conversionRatesToday.rates[specialConversionRates[i].name] =
          specialConversionRates[i].value;
      }
    }
    return conversionRatesToday;
  }
}

module.exports = ExtendedConversionRate;
