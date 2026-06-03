"use strict";

const { logger } = require("#infra");
const { Const } = require("#config");
const Utils = require("#utils");
const { FlomMessage, User, WhatsAppLog } = require("#models");
const Logics = require("#logics");

const userLockMap = {};

async function sendPendingWhatsAppMessages(from) {
  try {
    if (!from) {
      logger.error("sendPendingWhatsAppMessages error, missing from parameter");
      return;
    }

    if (!from.startsWith("+")) {
      from = "+" + from;
    }

    if (userLockMap[from]) {
      logger.warn(
        `sendPendingWhatsAppMessages, already sending pending messages for sender: ${from}`,
      );
      return;
    }

    userLockMap[from] = true;

    const receiver = await User.findOne({ phoneNumber: from }).lean();
    if (!receiver) {
      logger.error(
        `sendPendingWhatsAppMessages error, receiver not found with phoneNumber: ${from}`,
      );
      delete userLockMap[from];
      return;
    }

    const pendingMessages = await FlomMessage.find({
      wamStatus: "pending",
      receiverPhoneNumber: from,
      deleted: { $exists: false },
    })
      .sort({ created: 1 })
      .lean();

    if (pendingMessages.length === 0) {
      delete userLockMap[from];
      return;
    }

    logger.info(
      `sendPendingWhatsAppMessages, found ${pendingMessages.length} pending messages for sender: ${from}`,
    );

    for (const m of pendingMessages) {
      const wamIds = await Logics.sendWhatsAppMessages({
        senderId: m.userID,
        receivers: [receiver],
        message: m.message,
        messageType: m.type,
        location: m.location,
        file: m.file?.file,
      });

      if (wamIds.length > 0) {
        await FlomMessage.updateOne({ _id: m._id }, { $set: { wamId: wamIds[0] } });

        let breakLoop = false,
          attempts = 0;
        const limit = 20;

        while (breakLoop === false && attempts < limit) {
          const log = await WhatsAppLog.findOne({ wamId: wamIds[0] }).lean();
          attempts++;

          if (log && log.status && ["delivered", "read"].includes(log.status)) {
            breakLoop = true;
          }

          await Utils.sleep(3000); // wait 3 seconds before checking the status again
        }

        if (!breakLoop) {
          logger.error(
            `sendPendingWhatsAppMessages error, message with id: ${m._id.toString()} was not sent after ${attempts} attempts`,
          );
          await FlomMessage.updateOne({ _id: m._id }, { $set: { wamStatus: "failed" } });

          break;
        }
      } else {
        logger.error(
          `sendPendingWhatsAppMessages error, failed to send message with id: ${m._id.toString()} to ${from}`,
        );
        await FlomMessage.updateOne({ _id: m._id }, { $set: { wamStatus: "failed" } });
        break;
      }

      await Utils.sleep(2000); // wait 2 seconds between messages
    }

    delete userLockMap[from];
    return;
  } catch (error) {
    logger.error("sendPendingWhatsAppMessages error", error);
    delete userLockMap[from];
    return;
  }
}

module.exports = sendPendingWhatsAppMessages;
