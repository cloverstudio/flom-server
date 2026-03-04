function isProductForSale(product) {
  const { originalPrice } = product;

  if (!originalPrice) return false;

  let hasPrice = false;

  Object.keys(originalPrice).forEach((key) => {
    if (key.toLowerCase().includes("value") && originalPrice[key] > 0) {
      hasPrice = true;
    }
  });

  return hasPrice;
}

module.exports = isProductForSale;
