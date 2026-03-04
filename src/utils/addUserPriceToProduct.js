const isProductForSale = require("./isProductForSale");
const roundNumber = require("./roundNumber");

function addUserPriceToProduct({
  product = {},
  userRate,
  userCountryCode,
  userCurrency,
  conversionRates,
}) {
  if (userRate && isProductForSale(product)) {
    const productRate = conversionRates.rates[product.originalPrice.currency];
    const userPrice = { countryCode: userCountryCode, currency: userCurrency };
    const originalPrice = product.originalPrice;

    Object.keys(originalPrice).forEach((key) => {
      if (key.toLowerCase().includes("value") && originalPrice[key] > 0) {
        userPrice[key] = roundNumber(originalPrice[key] * (userRate / productRate), 2);
      }
    });

    product.userPrice = userPrice;
  }

  return;
}

module.exports = addUserPriceToProduct;
