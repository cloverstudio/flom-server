const { Const } = require("#config");
const { ConversionRate, Configuration } = require("#models");

async function getConversionRates(date) {
  const conversionRatesToday = (
    await ConversionRate.find().sort({ date: -1, modified: -1 }).limit(1).lean()
  )[0];

  const specialConversionRates = await Configuration.find({
    type: Const.configurationTypeSpecialConversionRates,
  });

  if (specialConversionRates.length > 0) {
    for (let i = 0; i < specialConversionRates.length; i++) {
      conversionRatesToday.rates[specialConversionRates[i].name] = specialConversionRates[i].value;
    }
  }
  return conversionRatesToday;
}

module.exports = getConversionRates;
