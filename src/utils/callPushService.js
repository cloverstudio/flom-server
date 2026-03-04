const { logger } = require("#infra");
const { Config, Const } = require("#config");
const { User } = require("#models");
const sendRequest = require("./sendRequest");

async function callPushService(data, receiver = null) {
  try {
    if (data.pushToken && data.pushToken.length > 64) {
      const user = !receiver ? await User.findOne({ pushToken: data.pushToken }).lean() : receiver;

      if (!user.androidVersionCode || user.androidVersionCode < Const.androidNewPushVersion) {
        return true;
      }
    }

    data.source = "flom_v1";
    data.environment = Config.environment === "production" ? "production" : "development";

    await sendRequest({
      method: "POST",
      url: Config.pushServiceUrl,
      body: data,
      headers: {
        "Content-Type": "application/json",
      },
    });

    return;
  } catch (error) {
    logger.error("callPushService url: " + Config.pushServiceUrl);
    logger.error("callPushService", error);
    return;
  }
}

module.exports = callPushService;
