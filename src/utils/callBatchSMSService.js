const { logger } = require("#infra");
const { Config } = require("#config");
const sendRequest = require("./sendRequest");

async function callBatchSMSService(data) {
  if (Config.environment !== "production") {
    logger.info(data.phoneNumbers);
    return;
  }

  logger.info(data.phoneNumbers);

  try {
    await sendRequest({
      method: "POST",
      url: Config.batchSMSServiceUrl,
      headers: {
        "Content-Type": "application/json",
        token: Config.smsServiceToken,
      },
      body: data,
    });
  } catch (error) {
    logger.error("callBatchSMSService", error);
  }
}

module.exports = callBatchSMSService;
