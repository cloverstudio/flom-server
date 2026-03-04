const { logger } = require("#infra");
const { Config } = require("#config");
const sendRequest = require("./sendRequest");

async function sendMessageToChat({ messageData, senderToken }) {
  if (!senderToken) {
    logger.error(`sendMessageToChat, no token`);
    return;
  }

  logger.info(`sendMessageToChat, message : ${JSON.stringify(messageData)}`);

  try {
    await sendRequest({
      method: "POST",
      url: `${Config.webClientUrl}/api/v2/message/send`,
      headers: {
        "access-token": senderToken,
      },
      body: messageData,
    });
  } catch (error) {
    logger.error(`sendMessageToChat`, error);
  }

  return;
}

module.exports = sendMessageToChat;
