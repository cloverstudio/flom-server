"use strict";

const { logger } = require("#infra");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { User, Notification } = require("#models");
const fsp = require("fs/promises");
const sharp = require("sharp");

async function handleImageFile(file) {
  try {
    //NOTE add file extension to the name when implementing to New Flom
    const tempPath = file.path;
    const fileName = file.name;
    const destPath = Config.idPhotosPath + "/";
    const newFileName = Utils.getRandomString(32);
    const fileData = {
      file: {
        originalName: fileName,
        nameOnServer: newFileName,
      },
    };

    await sharp(tempPath)
      .png()
      .toFile(destPath + newFileName);

    const newFile = await fsp.stat(destPath + newFileName);

    fileData.fileType = Const.fileTypeImage;
    fileData.file.size = newFile.size;
    fileData.file.mimeType = "image/png";

    return fileData;
  } catch (error) {
    logger.error("IdApplicationController, handleImageFile", error);
    throw new Error("Error in handleImageFile");
  }
}

async function sendPushNotifications({ pushTokens, approvalStatus, approvalComment }) {
  let title = "ID application ";
  if (approvalStatus === Const.idApplicationStatusApproved) {
    title += "approved";
  } else {
    title += "declined";
  }

  for (let i = 0; i < pushTokens.length; i++) {
    await Utils.callPushService({
      pushToken: pushTokens[i],
      isVoip: false,
      unreadCount: 1,
      isMuted: false,
      payload: {
        pushType: Const.pushTypeIdApplication,
        info: {
          title,
          text: approvalComment,
        },
      },
    });
  }

  return;
}

async function sendNotifications({ userId, approvalStatus, approvalComment, idApplicationId }) {
  let title = "ID application ";
  let status = 0;
  if (approvalStatus === Const.idApplicationStatusApproved) {
    title += "approved";
    status = 1;
  } else {
    title += "declined";
    status = 2;
  }

  await Notification.create({
    title,
    text: approvalComment,
    receiverIds: [userId],
    senderId: Config.flomSupportAgentId,
    referenceId: idApplicationId,
    notificationType: Const.notificationTypeIdApplication,
    status,
  });
  await User.updateOne({ _id: userId }, { $inc: { "notifications.unreadCount": 1 } });

  return;
}

module.exports = { handleImageFile, sendPushNotifications, sendNotifications };
