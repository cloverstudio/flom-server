const { Config, Const } = require("#config");
const { logger } = require("#infra");
const { WhatsAppLog } = require("#models");
const sendRequest = require("../utils/sendRequest");

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
  productName,
  mentionSlug,
  isFreeMessage = false,
}) {
  try {
    if (!Config.enableWhatsApp) {
      logger.warn(
        "sendWhatsAppMessage, WhatsApp messaging is disabled, skipping sendWhatsAppMessage",
      );
      return null;
    }

    if (template && !Const.templateMap[template]) {
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
        case "sellerFollowup":
          if (!userName || !productName) {
            logger.error(
              "sendWhatsAppMessage error, missing parameters for sellerFollowup template: userName or productName: " +
                userName +
                ", " +
                productName,
            );
            return null;
          }
          textParamA = userName;
          textParamB = productName;
          break;
        default:
          logger.error("sendWhatsAppMessage error, invalid template name: " + template);
          return null;
      }

      if (isFreeMessage) {
        message = makeTextMessage({ template, textParamA, textParamB, buttonParam });
        data.text.body = `@${mentionSlug}: ${message}
        
        Quote this message or use the mention slug (@seller_name) to get your reply to the seller.`;
      } else {
        data.type = "template";
        delete data.text;

        data.template = makeTemplateMessage({ template, textParamA, textParamB, buttonParam });
      }
    }

    const id = Config.whatsAppPhoneNumberId;

    const { data: result, error } = await sendRequest({
      method: "POST",
      url: `https://graph.facebook.com/v25.0/${id}/messages`,
      headers: {
        Authorization: `Bearer ${Config.whatsAppAccessToken}`,
        "Content-Type": "application/json",
      },
      body: data,
      returnErrorAsData: true,
    });

    logger.info("sendWhatsAppMessage result: " + JSON.stringify(result));

    const wamId = result?.messages?.[0]?.id || null;
    const status = result?.messages?.[0]?.message_status ?? null;

    await WhatsAppLog.create({
      wamId,
      request: data,
      response: result,
      failures: !error ? [] : [JSON.stringify(error, null, 2)],
      status,
      template,
      to,
    });

    if (!wamId) {
      logger.error("sendWhatsAppMessage error, message not accepted");
      logger.error("sendWhatsAppMessage error, response: " + JSON.stringify(result));
      return null;
    }

    return wamId;
  } catch (error) {
    logger.error("sendWhatsAppMessage error", error);
    return null;
  }
}

function makeTemplateMessage({
  template,
  textParamA = null,
  textParamB = null,
  buttonParam = null,
}) {
  if (!template || !Const.templateMap[template]) return null;

  const base = {
    name: Const.templateMap[template],
    language: {
      code: "en",
      //code: "en_US",
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

    if (textParamB) {
      base.components[0].parameters.push({
        type: "text",
        text: textParamB,
      });
    }
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

const deepLink = {
  order: `https://flom.app/order?id=`,
  auction: `https://flom.app/auction?id=`,
  liveStream: `https://flom.app/livestream?id=`,
  product: `https://flom.app/product?id=`,
};

function makeTextMessage({ template, textParamA = null, textParamB = null, buttonParam = null }) {
  let text = null;

  switch (template) {
    case "goLive":
      text = `${textParamA} is live now!\n\nJoin the live stream: ${deepLink.liveStream}${buttonParam}`;
      break;
    case "auctionReminder":
      text = `Reminder: ${textParamA} auction is live now!\n\nJoin the auction: ${deepLink.liveStream}${buttonParam}`;
      break;
    case "secondChance":
      text = `Second chance to join ${textParamA} auction!\n\nJoin the auction: ${deepLink.auction}${buttonParam}`;
      break;
    case "shippingUpdate":
      text = `Shipping update for your order ${textParamA}: ${textParamB}\n\nTrack your order: ${deepLink.order}${buttonParam}`;
      break;
    case "pendingPayment":
      text = `Your payment for order ${textParamA} is pending. Please complete the payment.\n\nPay now: ${deepLink.order}${buttonParam}`;
      break;
    default:
      text = null;
  }

  return text;
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
