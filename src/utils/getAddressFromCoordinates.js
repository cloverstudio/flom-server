const { logger } = require("#infra");
const { Config } = require("#config");
const sendRequest = require("./sendRequest");
const { LocationRequestCache } = require("#models");

async function getAddressFromCoordinates({ lat, lon }) {
  try {
    const baseUrl = `${Config.locationIqUrl}/v1/reverse?lat=${lat}&lon=${lon}&format=json&normalizeaddress=1`;
    const url = baseUrl + `&key=${Config.locationIqKey}`;

    let data = {};

    const cache = await LocationRequestCache.findOne({
      url: baseUrl,
      modified: { $gt: Date.now() - 4 * 60 * 60 * 1000 },
    }).lean();

    if (cache) {
      if (!cache.success) {
        logger.error("getAddressFromCoordinates: cache found but marked as unsuccessful", cache);
        return undefined;
      }

      data = cache.dataObject;
    } else {
      const { data: d } = await sendRequest({
        method: "GET",
        url,
      });

      data = d;

      await LocationRequestCache.updateOne(
        { url: baseUrl },
        { url: baseUrl, dataObject: d, modified: Date.now(), success: d && d.address },
        { upsert: true },
      );

      if (!d || !d.address) {
        logger.error("getAddressFromCoordinates: no address found in response", d);
        return undefined;
      }
    }

    const res = data;

    const address = {
      country: res.address.country ?? "",
      countryCode: !res.address.country_code ? "" : res.address.country_code.toUpperCase(),
      city: res.address.city ?? "",
      road: res.address.road ?? "",
      houseNumber: res.address.house_number ?? "",
      postCode: res.address.postcode ?? "",
      displayName: res.display_name ?? "",
    };

    return address;
  } catch (error) {
    logger.error("getAddressFromCoordinates", error);
    return undefined;
  }
}

module.exports = getAddressFromCoordinates;
