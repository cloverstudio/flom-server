const { logger } = require("#infra");
const { Config, Const } = require("#config");
const { IpAddress } = require("#models");
const sendRequest = require("./sendRequest");

async function getCountryFromIpAddress({ IP }) {
  try {
    if (!IP || typeof IP !== "string") {
      logger.error("getCountryFromIpAddress, invalid IP: " + JSON.stringify(IP));
      return null;
    }

    const ipFromDatabase = await IpAddress.findOne({ IP }).lean();

    if (ipFromDatabase?.modified && ipFromDatabase.modified > Date.now() - Const.dayInMs * 7) {
      return ipFromDatabase;
    }

    const response = await sendRequest({
      method: "GET",
      url: `${Config.ipCheckUrl}/${IP}`,
      query: {
        key: Config.ipCheckApiKey,
        vpn: "3",
        asn: "1",
        risk: "1",
        short: "1",
      },
    });

    if (response?.status !== "ok") {
      throw new Error("Error in countryFromIP v2, response: " + JSON.stringify(response));
    }

    let isVPN = false;

    if (
      response?.proxy === "yes" ||
      response?.vpn === "yes" ||
      (response?.risk && response?.risk > 60)
    ) {
      isVPN = true;
    }

    const { isocode, latitude, longitude } = response;

    const newIP = await IpAddress.findOneAndUpdate(
      { IP },
      { IP, countryCode: isocode, isVPN, latitude, longitude, modified: Date.now() },
      { upsert: true, new: true, lean: true },
    );

    return newIP;
  } catch (error) {
    logger.error("Error in getCountryFromIpAddress", error);
    return process.env.NODE_ENV !== "production"
      ? { isVPN: false, latitude: null, longitude: null }
      : null;
  }
}

module.exports = getCountryFromIpAddress;
