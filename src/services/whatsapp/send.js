const { Config, Const } = require("#config");
const { logger } = require("#infra");
const { WhatsAppLog } = require("#models");
const Utils = require("#utils");
const createFreeMessageBody = require("./create-free-message-body");
const createTemplateMessageBody = require("./create-template-message-body");

// params: userName, liveStreamId, auctionName, auctionId, shippingStatus, orderId, orderName, productName, slug, messageText, urlStub, headerImageUrl, headerText, voiceUrl

async function send({
  to,
  from,
  message,
  template = null,
  isFreeMessage = false,
  messageType,
  location,
  file,
  ...params
}) {
  try {
    if (!Config.enableWhatsApp) {
      logger.warn("WhatsApp, send, WhatsApp messaging is disabled, skipping send");
      return null;
    }

    if (template && !Const.templateMap[template]) {
      logger.warn("WhatsApp, send, Template not found for send: " + template);
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
      handleChatMessage({ data, messageType, location, file, message });
    } else if (template) {
      if (isFreeMessage) {
        message = createFreeMessageBody({ template, ...params });
        data.text = { body: message };
      } else {
        data.type = "template";
        delete data.text;

        data.template = createTemplateMessageBody({ template, ...params });
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

    logger.info("WhatsApp, send, result: " + JSON.stringify(result));

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
      logger.error("WhatsApp, send, message not accepted");
      logger.error("WhatsApp, send, response: " + JSON.stringify(result));
      return null;
    }

    return wamId;
  } catch (error) {
    logger.error("WhatsApp, send, error", error);
    return null;
  }
}

function handleChatMessage({ data, messageType, location, file, message }) {
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
  }
}

module.exports = send;

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
