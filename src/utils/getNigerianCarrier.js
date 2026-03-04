const { logger } = require("#infra");
const { Config } = require("#config");
const sendRequest = require("./sendRequest");

async function getNigerianCarrier(phoneNumber) {
  try {
    const operationId = `Flom-OperatorQuery-${Date.now()}`;
    const fixedPhoneNumber = phoneNumber.startsWith("+") ? phoneNumber.slice(1) : phoneNumber;

    const response = await sendRequest({
      method: "POST",
      url: `${process.env.QRIOS_BASE_URL}/operator/query`,
      headers: Config.qriosHeaders,
      body: { msisdn: fixedPhoneNumber, operationId },
    });

    return response.operator === "etisalat" ? "9mobile" : response.operator;
  } catch (error) {
    logger.error(`getNigerianCarrier`, error);
    return null;
  }
}

module.exports = getNigerianCarrier;
