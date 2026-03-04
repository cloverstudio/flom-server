const { CreditPackage } = require("#models");

async function getCreditPackages(countryCode) {
  const creditPackages = await CreditPackage.find().lean();

  if (!creditPackages || creditPackages.length === 0) return [];

  const packages = creditPackages
    .filter((package) => {
      let hasPackage = false,
        hasDefault = false,
        countryBanned = false;
      for (let i = 0; i < package.values.length; i++) {
        if (package.values[i].countryCode === countryCode && package.values[i].value > 0)
          hasPackage = true;
        if (package.values[i].countryCode === countryCode && package.values[i].value <= 0)
          countryBanned = true;
        if (package.values[i].countryCode === "default") hasDefault = true;
      }
      if (hasPackage || (!hasPackage && !countryBanned && hasDefault)) return package;
    })
    .map((package) => {
      let value = null,
        defaultValue = 0;
      for (let i = 0; i < package.values.length; i++) {
        if (package.values[i].countryCode === countryCode) value = package.values[i].value;
        if (package.values[i].countryCode === "default") defaultValue = package.values[i].value;
      }
      return {
        productId: package.productId,
        value: value ?? defaultValue,
      };
    });

  return packages;
}

module.exports = { getCreditPackages };
