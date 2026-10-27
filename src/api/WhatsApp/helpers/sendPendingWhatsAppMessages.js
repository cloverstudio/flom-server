"use strict";

const { logger } = require("#infra");
const { Const } = require("#config");
const Utils = require("#utils");
const { FlomMessage, User, WhatsAppLog } = require("#models");
const { WhatsApp: W } = require("#services");

const userLockMap = {};

async function sendPendingWhatsAppMessages(to) {
  try {
    if (!to) {
      logger.error("sendPendingWhatsAppMessages error, missing to parameter");
      return;
    }

    if (!to.startsWith("+")) {
      to = "+" + to;
    }

    if (userLockMap[to]) {
      logger.warn(
        `sendPendingWhatsAppMessages, already sending pending messages for sender: ${to}`,
      );
      return;
    }

    userLockMap[to] = true;

    const receiver = await User.findOne({ phoneNumber: to }).lean();
    if (!receiver) {
      logger.error(`sendPendingWhatsAppMessages error, receiver not found with phoneNumber: ${to}`);
      delete userLockMap[to];
      return;
    }

    const pendingMessages = await FlomMessage.find({
      wamStatus: "pending",
      receiverPhoneNumber: to,
      deleted: { $exists: false },
    })
      .sort({ created: 1 })
      .lean();

    if (pendingMessages.length === 0) {
      delete userLockMap[to];
      return;
    }

    logger.info(
      `sendPendingWhatsAppMessages, found ${pendingMessages.length} pending messages for sender: ${to}`,
    );

    for (const m of pendingMessages) {
      const wamId = await W.send({
        to: receiver.phoneNumber,
        from: m.senderPhoneNumber || m.userID,
        type: "service",
        message: m.message,
        messageType: m.type,
        location: m.location,
        file: m.file?.file,
      });

      if (wamId) {
        await FlomMessage.updateOne({ _id: m._id }, { $set: { wamId } });

        let breakLoop = false,
          attempts = 0;
        const limit = 20;

        while (breakLoop === false && attempts < limit) {
          await Utils.sleep(4000); // wait 4 seconds before checking status

          const log = await WhatsAppLog.findOne({ wamId }).lean();
          attempts++;

          if (log && log.status && ["sent", "delivered", "read"].includes(log.status)) {
            breakLoop = true;
          }
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
          `sendPendingWhatsAppMessages error, failed to send message with id: ${m._id.toString()} to ${to}`,
        );
        await FlomMessage.updateOne({ _id: m._id }, { $set: { wamStatus: "failed" } });
        break;
      }

      await Utils.sleep(1000); // wait 1 second between messages
    }

    delete userLockMap[to];
    return;
  } catch (error) {
    logger.error("sendPendingWhatsAppMessages error", error);
    delete userLockMap[to];
    return;
  }
}

module.exports = sendPendingWhatsAppMessages;
