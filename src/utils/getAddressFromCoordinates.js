const { logger } = require("#infra");
const { Config } = require("#config");
const sendRequest = require("./sendRequest");

async function getAddressFromCoordinates({ lat, lon }) {
  try {
    const { data: res } = await sendRequest({
      method: "GET",
      url: `${Config.locationIqUrl}/v1/reverse?key=${Config.locationIqKey}&lat=${lat}&lon=${lon}&format=json&normalizeaddress=1`,
    });

    if (!res || !res.address) {
      logger.error("getAddressFromCoordinates: no address found in response", res);
      return undefined;
    }

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
