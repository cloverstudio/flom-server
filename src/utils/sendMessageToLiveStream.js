const uuid = require("uuid").v4;
const { logger } = require("#infra");
const { Config } = require("#config");
const sendRequest = require("./sendRequest");

async function sendMessageToLiveStream({ liveStream, data }) {
  try {
    data.source = "server";
    data.environment = Config.environment === "production" ? "production" : "development";
    data.messageId = uuid().toUpperCase();

    const liveStreamId = liveStream._id.toString();

    if (data.messageType !== "numberOfViewers" || data.test) {
      /*
        logger.info(
          "Send message to live stream, id: " + liveStreamId + " data: " + JSON.stringify(data)
        );
        */
    }

    const url = !liveStream.domain
      ? `${Config.antMediaBaseUrl}/v2/broadcasts/${liveStreamId}/data`
      : `https://${liveStream.domain}/WebRTCAppEE/rest/v2/broadcasts/${liveStreamId}/data`;

    const response = await sendRequest({
      method: "POST",
      url,
      headers: { "content-type": "application/json" },
      body: data,
    });

    if (response.message && response.message === "Requested WebRTC stream does not exist")
      return false;

    if (response.success && response.success === "false")
      logger.error("Send message to live stream, error: " + JSON.stringify(response));

    return true;
  } catch (error) {
    logger.error("Send message to live stream, error", error);
    return false;
  }
}

module.exports = sendMessageToLiveStream;
