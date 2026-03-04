const { logger } = require("#infra");
const { Config } = require("#config");
const sendRequest = require("./sendRequest");

async function getDataProductBySku(sku) {
  try {
    const response = await sendRequest({
      method: "GET",
      url: "https://deep.qrios.com/api/v1/acquire/products",
      headers: Config.qriosHeaders,
    });

    const product = response.filter((product) => product.sku == sku)[0];
    if (!product) {
      logger.error(`getDataProductBySku error: no product found for sku ${sku}`);
      return;
    }
    return product;
  } catch (error) {
    logger.error(`getDataProductBySku error: ${JSON.stringify(error)}`);
  }
}

module.exports = getDataProductBySku;
