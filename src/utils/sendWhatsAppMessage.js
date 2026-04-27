const { Config } = require("#config");
const { logger } = require("#infra");
const sendRequest = require("./sendRequest");

async function sendWhatsAppMessage({ to, message, type, template }) {
  try {
    if (!Config.enableWhatsApp) {
      logger.warn("WhatsApp messaging is disabled, skipping sendWhatsAppMessage");
      return null;
    }

    to = to.replace("+", "");

    const data = {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: message },
    };

    if (type === "template") {
      data.type = "template";
      delete data.text;

      data.template = getTemplateParams(template);

      if (!data.template) {
        logger.error("sendWhatsAppMessage error, invalid template name: " + template);
        // TODO: whatsapp log
        return null;
      }
    }

    const id = Config.whatsAppPhoneNumberId;

    const result = await sendRequest({
      method: "POST",
      url: `https://graph.facebook.com/v25.0/${id}/messages`,
      headers: {
        Authorization: `Bearer ${Config.whatsAppAccessToken}`,
        "Content-Type": "application/json",
      },
      body: data,
    });

    logger.info("sendWhatsAppMessage result: " + JSON.stringify(result));

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

function getTemplateParams(templateName) {
  if (!templateName) return null;

  if (templateName === "goLive") {
    return {
      name: "go_live",
      language: {
        code: "en_US",
      },
      components: [
        {
          type: "body",
          parameters: [
            {
              type: "text",
              text: "",
            },
          ],
        },
        {
          type: "button",
          sub_type: "url",
          index: "0",
          parameters: [
            {
              type: "text",
              text: "",
            },
          ],
        },
      ],
    };
  }
}

module.exports = sendWhatsAppMessage;

/*
{
  "messaging_product": "whatsapp",
  "to": "3859XXXXXXX",
  "type": "template",
  "template": {
    "name": "stream_live_alert",
    "language": {
      "code": "en_US"
    },
    "components": [
      {
        "type": "body",
        "parameters": [
          {
            "type": "text",
            "text": "Ninja"
          }
        ]
      },
      {
        "type": "button",
        "sub_type": "url",
        "index": "0",
        "parameters": [
          {
            "type": "text",
            "text": "1234"
          }
        ]
      }
    ]
  }
}
*/
