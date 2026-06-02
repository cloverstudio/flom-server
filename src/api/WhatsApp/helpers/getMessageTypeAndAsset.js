const { logger } = require("#infra");
const { Const, Config } = require("#config");
const { FlomFile } = require("#models");
const Utils = require("#utils");
const Logics = require("#logics");
const mediaHandler = require("#media");
const path = require("path");
const fsp = require("fs/promises");
const sharp = require("sharp");

const typeToFlomTypeMap = {
  text: Const.messageTypeText,
  location: Const.messageTypeLocation,
  image: Const.messageTypeImage,
  video: Const.messageTypeVideo,
  audio: Const.messageTypeAudio,
  document: Const.messageTypeFile,
};

async function getMessageTypeAndAsset(message) {
  try {
    const type = message.type;
    const messageType = typeToFlomTypeMap[type] || null;

    if (!messageType) {
      return { type: null };
    }

    if (type === "text") {
      return { type, messageType, msgBody: message.text?.body ?? "" };
    }

    if (type === "location") {
      const { latitude, longitude, name, address } = message.location ?? {};
      if (latitude && longitude) {
        return {
          type,
          messageType,
          msgBody: name ?? address ?? "",
          location: { lat: parseFloat(latitude.toFixed(6)), lng: parseFloat(longitude.toFixed(6)) },
        };
      }
    }

    if (["image", "video", "audio", "document"].includes(type)) {
      const asset = message[type];

      if (!asset) {
        logger.warn(
          `getMessageTypeAndAsset: message of type ${type} does not have the expected ${type} field`,
        );
        return { type: null };
      }

      const assetId = asset.id;
      const url = asset.url;
      const msgBody = asset.caption ?? "";
      let mimeType = asset.mime_type ?? null;
      let extension = null;

      switch (mimeType) {
        case "image/jpeg":
          extension = "jpg";
          break;
        case "image/png":
          extension = "png";
          break;
        case "video/mp4":
          extension = "mp4";
          break;
        default:
          extension = null;
      }

      if (mimeType.includes("audio/ogg")) {
        extension = "ogg";
      }

      const now = Date.now();

      let fileName = asset.filename
        ? now.toString() + "_" + asset.filename
        : now.toString() + "." + extension;

      const outputPath = path.resolve(Const.uploadPath, fileName);
      const res = await Utils.downloadFile({
        url,
        outputPath,
        headers: { Authorization: `Bearer ${Config.whatsAppAccessToken}` },
      });

      if (res.error) {
        logger.error(
          `getMessageTypeAndAsset: error downloading file from url ${url}: ${res.error}`,
        );
        return { type: null };
      }

      const fileInfo = { mimeType, name: fileName, created: now };

      if (type === "document") {
        const info = await fsp.stat(outputPath);
        fileInfo.size = info.size;
      }
      if (type === "audio" || type === "video") {
        const info = await mediaHandler.getMediaInfo(outputPath);
        fileInfo.duration = info.duration;
        fileInfo.size = info.size;
      }
      if (type === "image") {
        const info = await mediaHandler.getImageInfo(outputPath);
        fileInfo.size = info.size;
      }

      const file = {};
      file.file = await FlomFile.create(fileInfo);

      if (type === "image" || type === "video") {
        let thumbSourcePath = outputPath;
        if (type === "video") {
          thumbSourcePath = path.resolve(Const.uploadPath, "thumbsource_" + fileName + ".jpg");
          await Utils.executeCommand({
            command: `ffmpeg -ss 1 -i ${outputPath} -frames:v 1 ${thumbSourcePath}`,
          });
        }

        const thumbOutputPath = path.resolve(Const.uploadPath, "thumb_" + fileName + ".jpg");
        const thumb = await sharp(thumbSourcePath)
          .resize(300, 300, { fit: "inside" })
          .toFile(thumbOutputPath);
        file.thumb = await FlomFile.create({
          mimeType: "image/jpeg",
          name: "thumb_" + fileName + ".jpg",
          size: thumb.size,
        });

        if (type === "video") {
          await fsp.unlink(thumbSourcePath);
        }
      }

      const response = {};
      response.type = type;
      response.messageType = messageType;
      response.file = file;
      response.msgBody = msgBody;

      return response;
    }

    return { type: null };
  } catch (error) {
    logger.error("getMessageTypeAndAsset error: ", error);
    return { type: null };
  }
}

module.exports = getMessageTypeAndAsset;
