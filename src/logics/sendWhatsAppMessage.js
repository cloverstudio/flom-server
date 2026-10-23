const { Config, Const } = require("#config");
const { logger } = require("#infra");
const { WhatsAppLog } = require("#models");
const Utils = require("#utils");

async function sendWhatsAppMessage({
  to,
  from,
  message,
  template = null,
  isFreeMessage = false,
  messageType,
  location,
  file,
  userName,
  liveStreamId,
  auctionName,
  auctionId,
  shippingStatus,
  orderId,
  orderName,
  productName,
}) {
  try {
    if (!Config.enableWhatsApp) {
      logger.warn(
        "sendWhatsAppMessage, WhatsApp messaging is disabled, skipping sendWhatsAppMessage",
      );
      return null;
    }

    if (template && !Const.waTemplates.includes(template)) {
      logger.warn("sendWhatsAppMessage, Template not found for sendWhatsAppMessage: " + template);
      return null;
    }

    to = to.replace("+", "");

    const data = {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: message },
    };

    if (messageType) {
      console.log("sendWhatsAppMessage, messageType: " + messageType);
      console.log("sendWhatsAppMessage, location: " + JSON.stringify(location));
      console.log("sendWhatsAppMessage, file: " + JSON.stringify(file));
    }

    if (messageType === Const.messageTypeLocation && location) {
      data.type = "location";
      delete data.text;

      data.location = {
        latitude: location.lat,
        longitude: location.lng,
      };
    } else if (messageType === Const.messageTypeFile && file) {
      data.type = "document";
      delete data.text;

      data.document = {
        link: Config.storageUrl + "/" + file.name,
        filename: file.name,
        caption: message,
      };
    } else if (
      [Const.messageTypeAudio, Const.messageTypeImage, Const.messageTypeVideo].includes(
        messageType,
      ) &&
      file
    ) {
      data.type =
        messageType === Const.messageTypeAudio
          ? "audio"
          : messageType === Const.messageTypeImage
          ? "image"
          : "video";

      delete data.text;

      data[data.type] = {
        link: Config.storageUrl + "/" + (file._id || file.id).toString(),
        ...(messageType == Const.messageTypeAudio && { voice: true }),
      };

      if (data.type !== "audio") {
        data[data.type].caption = message;
      }
    } else if (template) {
      let textParamA = null;
      let textParamB = null;
      let buttonParam = null;

      switch (template) {
        case "go_live":
          if (!userName || !liveStreamId) {
            logger.error(
              "sendWhatsAppMessage error, missing parameters for go_live template: userName or liveStreamId: " +
                userName +
                ", " +
                liveStreamId,
            );
            return null;
          }
          textParamA = userName;
          buttonParam = liveStreamId;
          break;
        case "auction_reminder":
          if (!auctionName || !auctionId || !liveStreamId) {
            logger.error(
              "sendWhatsAppMessage error, missing parameters for auction_reminder template: auctionName or auctionId or liveStreamId: " +
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
        case "second_chance":
          if (!auctionName || !auctionId) {
            logger.error(
              "sendWhatsAppMessage error, missing parameters for second_chance template: auctionName or auctionId: " +
                auctionName +
                ", " +
                auctionId,
            );
            return null;
          }
          textParamA = auctionName;
          buttonParam = auctionId;
          break;
        case "shipping_update":
          if (!orderId || !shippingStatus || !orderName) {
            logger.error(
              "sendWhatsAppMessage error, missing parameters for shipping_update template: orderId or shippingStatus or orderName: " +
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
        case "pending_payment":
          if (!orderId || !orderName) {
            logger.error(
              "sendWhatsAppMessage error, missing parameters for pending_payment template: orderId or orderName: " +
                orderId +
                ", " +
                orderName,
            );
            return null;
          }
          textParamA = orderName;
          buttonParam = orderId;
          break;
        case "seller_followup":
          if (!userName || !productName) {
            logger.error(
              "sendWhatsAppMessage error, missing parameters for seller_followup template: userName or productName: " +
                userName +
                ", " +
                productName,
            );
            return null;
          }
          textParamA = userName;
          textParamB = productName;
          break;
        case "unknown_recipient_notice":
          break;
        case "engage_v1":
          if (!userName || !message) {
            logger.error(
              "sendWhatsAppMessage error, missing parameters for engage_v1 template: userName or message: " +
                userName +
                ", " +
                message,
            );
            return null;
          }
          textParamA = userName;
          textParamB = message;
          break;
        default:
          logger.error("sendWhatsAppMessage error, invalid template name: " + template);
          return null;
      }

      if (isFreeMessage) {
        message = makeTextMessage({ template, textParamA, textParamB, buttonParam });
        data.text = { body: message };
      } else {
        data.type = "template";
        delete data.text;

        data.template = makeTemplateMessage({ template, textParamA, textParamB, buttonParam });
      }
    }

    const id = Config.whatsAppPhoneNumberId;

    const { data: result, err } = await Utils.sendRequest({
      method: "POST",
      url: `https://graph.facebook.com/v25.0/${id}/messages`,
      headers: {
        Authorization: `Bearer ${Config.whatsAppAccessToken}`,
        "Content-Type": "application/json",
      },
      body: data,
    });

    logger.info("sendWhatsAppMessage result: " + JSON.stringify(result));

    const wamId = result?.messages?.[0]?.id || null;
    const status = result?.messages?.[0]?.message_status ?? null;

    await WhatsAppLog.create({
      wamId,
      request: data,
      response: result,
      failures: !err ? [] : [err],
      status,
      template,
      to: "+" + to,
      from,
      direction: "outgoing",
      providerId: Config.whatsAppPhoneNumberId,
      providerPhoneNumber: Config.whatsAppPhoneNumber,
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
  if (!template || !Const.waTemplates.includes(template)) return null;

  const base = {
    name: template,
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
    case "go_live":
      text = `${textParamA} is live now!\n\nJoin the live stream: ${deepLink.liveStream}${buttonParam}`;
      break;
    case "auction_reminder":
      text = `Reminder: ${textParamA} auction is live now!\n\nJoin the auction: ${deepLink.liveStream}${buttonParam}`;
      break;
    case "second_chance":
      text = `Second chance to join ${textParamA} auction!\n\nJoin the auction: ${deepLink.auction}${buttonParam}`;
      break;
    case "shipping_update":
      text = `Shipping update for your order ${textParamA}: ${textParamB}\n\nTrack your order: ${deepLink.order}${buttonParam}`;
      break;
    case "pending_payment":
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
