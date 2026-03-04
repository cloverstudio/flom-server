const { logger } = require("#infra");
const sendRequest = require("./sendRequest");

async function getAddressFromCoordinates({ lat, lon }) {
  try {
    const res = await sendRequest({
      method: "GET",
      url: `${process.env.LOCATION_IQ_URL}?key=${process.env.LOCATION_IQ_APIKEY}&lat=${lat}&lon=${lon}&format=json&normalizeaddress=1`,
    });

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
