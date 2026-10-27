"use strict";

const { logger } = require("#infra");
const { Const } = require("#config");
const { User } = require("#models");
const { WhatsApp: W } = require("#services");

async function handleStartMessage({ from }) {
  try {
    const businessUser = await User.findOne({
      "whatsApp.businessPhoneNumber": from,
      "whatsApp.businessConnected": true,
      "isDeleted.value": false,
    });
    if (businessUser) {
      logger.warn(
        `WhatsAppCallbackController, cb: received FLOM START message from ${from}, but this business phone number is already connected, skipping processing`,
      );

      await W.send({
        to: from,
        from: "flom",
        type: "service",
        message:
          "FLOM START message received, but this business phone number is already connected.",
        messageType: "text",
      });

      return;
    }

    const existingUser = await User.findOne({ phoneNumber: from }).lean();
    if (existingUser && existingUser.hasLoggedIn !== Const.userShadowUser) {
      logger.warn(
        `WhatsAppCallbackController, cb: received FLOM START message from ${from}, but there is a user registered with this business phone number, skipping processing`,
      );
      await W.send({
        to: from,
        from: "flom",
        type: "service",
        message:
          "FLOM START message received, but there is a user registered with this business phone number.",
        messageType: "text",
      });
      return;
    }

    const user = await User.findOneAndUpdate(
      { "whatsApp.businessPhoneNumber": from },
      { "whatsApp.businessConnected": true },
      { new: true, lean: true },
    );

    if (existingUser) {
      const now = Date.now();

      await User.findByIdAndUpdate(existingUser._id, {
        isLoginForbidden: true,
        aliasForUserId: user._id.toString(),
        forbiddenUserInfo: {
          forbiddenAt: now,
          phoneNumber: existingUser.phoneNumber,
          userName: existingUser.userName,
          name: existingUser.name,
          bankAccounts: existingUser.bankAccounts || [],
        },
        phoneNumber: `Forbidden-${existingUser.phoneNumber}-${now}`,
        userName: `Forbidden-${existingUser.userName}-${now}`,
        name: `Forbidden-${existingUser.name || "Unknown"}-${now}`,
        bankAccounts: [],
      });
    }

    await W.send({
      to: from,
      from: "flom",
      type: "service",
      message:
        "FLOM START message received, your business phone number has been marked as connected.",
      messageType: "text",
    });

    logger.info(
      `WhatsAppCallbackController, cb: received FLOM START message, marked business phone number ${from} as connected`,
    );

    return;
  } catch (error) {
    logger.error(
      `WhatsAppCallbackController, cb: error processing FLOM START message from ${from}: ${error.message}`,
    );

    await W.send({
      to: from,
      from: "flom",
      type: "service",
      message:
        "FLOM START message received, but there was an error processing your request. Please try again later.",
      messageType: "text",
    });

    return;
  }
}

module.exports = handleStartMessage;
