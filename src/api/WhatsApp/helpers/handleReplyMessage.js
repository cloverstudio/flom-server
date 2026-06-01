"use strict";

const { logger, encryptionManager } = require("#infra");
const { Const } = require("#config");
const { FlomMessage, User, WhatsAppLog, WhatsAppSession } = require("#models");
const Logics = require("#logics");

async function handleReplyMessage({
  from,
  msgBody,
  wamId,
  timeStamp,
  contextId,
  logId,
  messageType,
  file,
  location,
}) {
  const originalMessage = await FlomMessage.findOne({ wamId: contextId }).lean();
  if (!originalMessage) {
    logger.error("WhatsAppCallbackController, cb: original message not found: ", contextId);
    return;
  }

  const fromUser = await User.findOne({ phoneNumber: from }).lean();
  if (!fromUser) {
    logger.error("WhatsAppCallbackController, cb: fromUser not found with phoneNumber: " + from);
    return;
  }

  const toUser = await User.findById(originalMessage.userID).lean();
  if (!toUser) {
    logger.error(
      "WhatsAppCallbackController, cb: toUser not found with userID: " + originalMessage.userID,
    );
    return;
  }

  await WhatsAppSession.updateOne(
    { from, to: toUser.phoneNumber },
    { toSlug: toUser.slug, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    { upsert: true },
  );

  await WhatsAppLog.findByIdAndUpdate(logId, { to: toUser.phoneNumber });

  const params = {
    isRecursiveCall: false,
    type: messageType,
    userID: fromUser._id.toString(),
    roomID: originalMessage.roomID,
    message: msgBody,
    created: timeStamp,
    wamId,
    plainTextMessage: true,
    attributes: {
      replyMessage: {
        _id: originalMessage._id.toString(),
        created: originalMessage.created,
        roomID: originalMessage.roomID,
        type: originalMessage.type,
        userId: toUser._id.toString(),
        userName: toUser.userName,
        message: encryptionManager.encryptText(originalMessage.message), // encrypted
        decryptedMessage: originalMessage.message,
      },
    },
    file,
    location,
  };

  await Logics.sendMessage(params);

  return;
}

module.exports = handleReplyMessage;
