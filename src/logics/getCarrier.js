const { logger } = require("#infra");
const { Config, Const } = require("#config");
const Utils = require("#utils");
const { NumberDefaultCarrier } = require("#models");

async function getPpnCarrier(phoneNumber) {
  try {
    const fixedPhoneNumber = phoneNumber.startsWith("+") ? phoneNumber.slice(1) : phoneNumber;

    const res = await Utils.sendRequest({
      method: "GET",
      url: `${process.env.PPN_API_V2}/lookup/mobile/${fixedPhoneNumber}`,
      headers: Config.ppnHeaders,
    });

    if (res.err) {
      logger.warn("getPpnCarrier, ppn lookup failed for number: " + phoneNumber);
      return null;
    }

    if (res?.data?.payLoad && res.data.payLoad[0]?.operatorName) {
      return res.data.payLoad[0].operatorName.toLowerCase();
    }

    logger.warn(
      `getPpnCarrier, ppn lookup for number ${phoneNumber} failed, response: ${JSON.stringify(
        res,
      )}`,
    );

    return null;
  } catch (error) {
    logger.error("Get PPN carrier", error);
    return null;
  }
}

async function getCarrier({ phoneNumber, countryCode }) {
  try {
    if (!phoneNumber) return "";

    countryCode = !countryCode ? Utils.getCountryCodeFromPhoneNumber({ phoneNumber }) : countryCode;

    if (!countryCode || countryCode === "US" || countryCode === "ES") return "";

    const numberDefaultCarrier = await NumberDefaultCarrier.findOne({
      phoneNumber,
    }).lean();

    if (
      numberDefaultCarrier &&
      numberDefaultCarrier.modified &&
      numberDefaultCarrier.modified > Date.now() - Const.dayInMs * 90
    ) {
      return numberDefaultCarrier.carrier;
    } else {
      let defaultCarrier =
        countryCode === "NG"
          ? await Utils.getNigerianCarrier(phoneNumber)
          : await getPpnCarrier(phoneNumber);

      if (defaultCarrier) {
        defaultCarrier = defaultCarrier.toLowerCase();

        await NumberDefaultCarrier.updateOne(
          { phoneNumber },
          {
            phoneNumber,
            carrier: defaultCarrier,
            modified: Date.now(),
          },
          { upsert: true },
        );

        return defaultCarrier;
      } else {
        return "";
      }
    }
  } catch (error) {
    logger.error("getCarrier", error);
    return "";
  }
}

module.exports = getCarrier;
