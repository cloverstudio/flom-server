const { Config, Const } = require("#config");
const { logger } = require("#infra");
const { WhatsAppLog } = require("#models");
const Utils = require("#utils");
const createTextMessageFromTemplate = require("./createTextMessageFromTemplate");
const createTemplateMessage = require("./createTemplateMessage");
const createServiceMessage = require("./createServiceMessage");

// params: userName, liveStreamId, auctionName, auctionId, shippingStatus, orderId, orderName, productName, slug, messageText, urlStub, headerImageUrl, headerText

async function send({
  to,
  from,
  type, // template, service_from_template, service
  message,
  template = null,
  messageType,
  location,
  file,
  voiceUrl,
  ...params
}) {
  try {
    if (!Config.enableWhatsApp) {
      logger.warn("WhatsApp, send, WhatsApp messaging is disabled, skipping send");
      return null;
    }

    if (template && !Const.waTemplates.includes(template)) {
      logger.warn("WhatsApp, send, Template not found for send: " + template);
      return null;
    }

    to = to.replace("+", "");

    let data, waType;

    switch (type) {
      case "service":
        const type = getServiceMessageType({ messageType, voiceUrl });
        data = createServiceMessage({ to, messageType: type, location, file, message, voiceUrl });
        waType = "service";
        break;
      case "template":
        data = createTemplateMessage({ to, template, ...params });
        waType = "utility";
        if (Const.waMarketingTemplates.includes(template)) {
          waType = "marketing";
        }
        break;
      case "service_from_template":
        console.log("Creating service_from_template message with template:", template);
        data = createTextMessageFromTemplate({ to, template, ...params });
        waType = "service";
        break;
      default:
        throw new Error("Invalid message type");
    }

    if (!data) {
      logger.error("WhatsApp, send, failed to create message data");
      return null;
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

    if (err) {
      logger.error("WhatsApp, send, error: " + JSON.stringify(err, null, 2));
    } else {
      logger.info("WhatsApp, send, success: " + JSON.stringify(result, null, 2));
    }

    const wamId = result?.messages?.[0]?.id || null;
    const status = result?.messages?.[0]?.message_status ?? null;

    await WhatsAppLog.create({
      wamId,
      request: data,
      response: result,
      failures: !err ? [] : [err],
      status,
      type,
      waType,
      template,
      to: "+" + to,
      from,
      direction: "outgoing",
      providerId: Config.whatsAppPhoneNumberId,
      providerPhoneNumber: Config.whatsAppPhoneNumber,
    });

    if (!wamId) {
      logger.error("WhatsApp, send, message not accepted");
      logger.error("WhatsApp, send, error: " + JSON.stringify(err, null, 2));
      return null;
    }

    return wamId;
  } catch (error) {
    logger.error("WhatsApp, send, error", error);
    return null;
  }
}

function getServiceMessageType({ messageType, voiceUrl }) {
  if (voiceUrl) {
    return "audio";
  }

  switch (messageType) {
    case Const.messageTypeLocation:
      return "location";
    case Const.messageTypeFile:
      return "document";
    case Const.messageTypeAudio:
      return "audio";
    case Const.messageTypeImage:
      return "image";
    case Const.messageTypeVideo:
      return "video";
    default:
      return "text";
  }
}

module.exports = send;
