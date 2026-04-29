const { Config } = require("#config");
const { logger } = require("#infra");
const sendRequest = require("./sendRequest");

const templateMap = {
  sellerMessage: "seller_message",
  goLive: "go_live",
  newDrop: "new_drop",
  auctionReminder: "auction_reminder",
  bookingConfirmation: "booking_confirmation",
  bookingReminder: "booking_reminder",
  secondChance: "second_chance",
  shippingUpdate: "shipping_update",
  pendingPayment: "pending_payment",
};

const marketingTemplates = [
  "sellerMessage",
  "newDrop",
  "auctionReminder",
  "secondChance",
  "goLive",
];

async function sendWhatsAppMessage({
  to,
  message,
  template = null,
  userName,
  liveStreamId,
  auctionName,
  auctionId,
  shippingStatus,
  orderId,
  orderName,
  mentionSlug,
}) {
  try {
    if (!Config.enableWhatsApp) {
      logger.warn(
        "sendWhatsAppMessage, WhatsApp messaging is disabled, skipping sendWhatsAppMessage",
      );
      return null;
    }

    if (!templateMap[template]) {
      logger.warn("sendWhatsAppMessage, Template not found for sendWhatsAppMessage: " + template);
      return null;
    }

    to = to.replace("+", "");

    const data = {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: {
        body: `@${mentionSlug}: ${message}
        
        Quote this message or use the mention slug (@seller_name) to get your reply to the seller.`,
      },
    };

    if (template) {
      data.type = "template";
      delete data.text;

      let textParamA = null;
      let textParamB = null;
      let buttonParam = null;

      switch (template) {
        case "goLive":
          if (!userName || !liveStreamId) {
            logger.error(
              "sendWhatsAppMessage error, missing parameters for goLive template: userName or liveStreamId: " +
                userName +
                ", " +
                liveStreamId,
            );
            return null;
          }
          textParamA = userName;
          buttonParam = liveStreamId;
          break;
        case "auctionReminder":
          if (!auctionName || !auctionId || !liveStreamId) {
            logger.error(
              "sendWhatsAppMessage error, missing parameters for auctionReminder template: auctionName or auctionId or liveStreamId: " +
                auctionName +
                ", " +
                auctionId +
                ", " +
                liveStreamId,
            );
            return null;
          }
          textParamA = auctionName;
          textParamB = auctionId;
          buttonParam = liveStreamId;
          break;
        case "secondChance":
          if (!auctionName || !auctionId) {
            logger.error(
              "sendWhatsAppMessage error, missing parameters for secondChance template: auctionName or auctionId: " +
                auctionName +
                ", " +
                auctionId,
            );
            return null;
          }
          textParamA = auctionName;
          buttonParam = auctionId;
          break;
        case "shippingUpdate":
          if (!orderId || !shippingStatus || !orderName) {
            logger.error(
              "sendWhatsAppMessage error, missing parameters for shippingUpdate template: orderId or shippingStatus or orderName: " +
                orderId +
                ", " +
                shippingStatus +
                ", " +
                orderName,
            );
            return null;
          }
          textParamA = orderName;
          textParamB = shippingStatus;
          buttonParam = orderId;
          break;
        case "pendingPayment":
          if (!orderId || !orderName) {
            logger.error(
              "sendWhatsAppMessage error, missing parameters for pendingPayment template: orderId or orderName: " +
                orderId +
                ", " +
                orderName,
            );
            return null;
          }
          textParamA = orderName;
          buttonParam = orderId;
          break;
        case "sellerMessage":
          if (!mentionSlug) {
            logger.error(
              "sendWhatsAppMessage error, missing parameters for sellerMessage template: mentionSlug: " +
                mentionSlug,
            );
            return null;
          }
          textParamA = mentionSlug;
          textParamB = message;
          break;
        default:
          logger.error("sendWhatsAppMessage error, invalid template name: " + template);
          return null;
      }

      data.template = getTemplateParams({ template, textParamA, textParamB, buttonParam });

      if (!data.template) {
        logger.error("sendWhatsAppMessage error, invalid template name: " + template);
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

function getTemplateParams({ template, textParamA = null, textParamB = null, buttonParam = null }) {
  if (!template || !templateMap[template]) return null;

  const base = {
    name: templateMap[template],
    language: {
      code: "en_US",
    },
    components: [],
  };

  if (textParamA) {
    base.components.push({
      type: "body",
      parameters: [
        {
          type: "text",
          text: textParamA,
        },
      ],
    });
  }
  if (textParamB) {
    base.components.push({
      type: "body",
      parameters: [
        {
          type: "text",
          text: textParamB,
        },
      ],
    });
  }
  if (buttonParam) {
    base.components.push({
      type: "button",
      sub_type: "url",
      index: "0",
      parameters: [
        {
          type: "text",
          text: buttonParam,
        },
      ],
    });
  }

  return base;
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
