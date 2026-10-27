const { Config } = require("#config");

function createServiceMessage({ to, messageType, location, file, message, voiceUrl }) {
  const data = { messaging_product: "whatsapp", to };

  if (messageType === "location" && location) {
    data.type = "location";

    data.location = {
      latitude: location.lat,
      longitude: location.lng,
    };
  } else if (messageType === "document" && file) {
    data.type = "document";

    data.document = {
      link: Config.storageUrl + "/" + file.name,
      filename: file.name,
      caption: message,
    };
  } else if (["audio", "image", "video"].includes(messageType) && (file || voiceUrl)) {
    data.type = messageType === "audio" ? "audio" : messageType === "image" ? "image" : "video";

    data[data.type] = {
      link: !voiceUrl ? Config.storageUrl + "/" + (file._id || file.id).toString() : voiceUrl,
      ...(messageType == "audio" && { voice: true }),
    };

    if (data.type !== "audio" && message) {
      data[data.type].caption = message;
    }
  } else {
    data.type = "text";
    data.text = { body: message };
  }

  return data;
}

module.exports = createServiceMessage;
