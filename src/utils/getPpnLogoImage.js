const fs = require("fs");
const { Config } = require("#config");
const sendRequest = require("./sendRequest");

async function getPpnLogoImage({ carrier, countryCode, sku }) {
  if (carrier && countryCode) {
    const carrierLogoName =
      carrier.trim().replace(" ", "_").toLowerCase() + "_" + countryCode.toLowerCase();

    const filePath = Config.carrierLogoPath + "/" + carrierLogoName + ".png";

    if (fs.existsSync(filePath)) {
      return `${Config.webClientUrl}/api/v2/carriers/logo/${carrierLogoName}`;
    } else {
      const defaultCarrierName = carrierLogoName.slice(0, -3).toLowerCase();
      const defaultCarrierFilePath = Config.carrierLogoPath + "/" + defaultCarrierName + ".png";
      if (fs.existsSync(defaultCarrierFilePath)) {
        return `${Config.webClientUrl}/api/v2/carriers/logo/${defaultCarrierName}`;
      } else {
        console.log(`CarrierLogoController - Default logo for ${carrierLogoName} not found...`);
        return undefined;
      }
    }
  }
  if (sku) {
    return await getPpnProductImage(sku);
  }
  return undefined;
}

async function getPpnProductImage(sku) {
  const res = await sendRequest({
    method: "GET",
    url: `${process.env.PPN_API_V1}/catalog/sku/logos?skuId=${sku}`,
    headers: Config.ppnHeaders,
  });

  const data = res && typeof res === "string" ? JSON.parse(res) : res;
  const payload = data.payLoad;

  if (!payload || payload.length === 0) {
    return undefined;
  }

  if (payload[0].imageUrl.indexOf("https") === -1) {
    return payload[0].imageUrl.replace("http", "https");
  }
  return payload[0].imageUrl;
}

module.exports = getPpnLogoImage;
