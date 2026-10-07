const { logger } = require("#infra");
const { LocationIQ } = require("#services");

async function getAddressFromCoordinates({ lat, lon }) {
  try {
    const data = (await LocationIQ.address({ lat, lon })) || {};

    if (!data.address) {
      logger.error("getAddressFromCoordinates: no address found in response", data);
      return undefined;
    }

    const address = {
      country: data.address.country ?? "",
      countryCode: !data.address.country_code ? "" : data.address.country_code.toUpperCase(),
      city: data.address.city ?? "",
      road: data.address.road ?? "",
      houseNumber: data.address.house_number ?? "",
      postCode: data.address.postcode ?? "",
      displayName: data.display_name ?? "",
    };

    return address;
  } catch (error) {
    logger.error("getAddressFromCoordinates", error);
    return undefined;
  }
}

module.exports = getAddressFromCoordinates;
