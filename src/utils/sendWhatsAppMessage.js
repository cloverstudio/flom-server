const { Config } = require("#config");
const { logger } = require("#infra");
const sendRequest = require("./sendRequest");

async function sendWhatsAppMessage({ to, message, instruction = false }) {
  try {
    const data = {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: message },
    };

    if (instruction) {
      data.type = "template";
      delete data.text;
      data.template = {
        name: "reply_instruction",
        language: { code: "en" },
      };
    }

    const id =
      Config.environment === "production"
        ? Config.whatsAppPhoneNumberId
        : Config.whatsAppDevPhoneNumberId;

    const result = await sendRequest({
      method: "POST",
      url: `https://graph.facebook.com/v25.0/${id}/messages`,
      headers: {
        Authorization: `Bearer ${Config.whatsAppAccessToken}`,
        "Content-Type": "application/json",
      },
      body: data,
    });

    const status = result?.messages?.[0]?.message_status ?? null;
    if (status !== "accepted" && status !== "sent" && status !== "delivered") {
      logger.error("sendWhatsAppMessage error, message not accepted");
      logger.error("sendWhatsAppMessage error, response: " + JSON.stringify(result));
      return null;
    }

    return result?.messages?.[0]?.id;
  } catch (error) {
    logger.error("sendWhatsAppMessage error", error);
    return null;
  }
}

module.exports = sendWhatsAppMessage;
