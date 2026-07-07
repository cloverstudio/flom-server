"use strict";

const { logger } = require("#infra");
const { Const, Config } = require("#config");
const { User, CoreIdentity, Business } = require("#models");
const Logics = require("#logics");

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
      await Logics.sendWhatsAppMessage({
        to: from,
        from: Config.whatsAppPhoneNumber,
        message:
          "FLOM START message received, but this business phone number is already connected.",
      });
      return;
    }

    const existingUser = await User.findOne({ phoneNumber: from }).lean();
    if (existingUser && existingUser.hasLoggedIn !== Const.userShadowUser) {
      logger.warn(
        `WhatsAppCallbackController, cb: received FLOM START message from ${from}, but there is a user registered with this business phone number, skipping processing`,
      );
      await Logics.sendWhatsAppMessage({
        to: from,
        from: Config.whatsAppPhoneNumber,
        message:
          "FLOM START message received, but there is a user registered with this business phone number.",
      });
      return;
    }

    const user = await User.findOneAndUpdate(
      { "whatsApp.businessPhoneNumber": from },
      { "whatsApp.businessConnected": true, hasBusiness: true },
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

    await Business.findOneAndUpdate(
      { "owner._id": user._id.toString() },
      {
        $set: {
          "owner.phoneNumber": user.phoneNumber,
          whatsAppPhoneNumber: from,
          whatsAppConnected: true,
        },
      },
      { upsert: true, new: true },
    );

    await CoreIdentity.createCoreIdentity({
      phoneNumber: from,
      userId: user ? user._id.toString() : null,
      channel: "whatsapp_business",
      created: Date.now(),
    });

    await Logics.sendWhatsAppMessage({
      to: from,
      from: Config.whatsAppPhoneNumber,
      message:
        "FLOM START message received, your business phone number has been marked as connected.",
    });

    logger.info(
      `WhatsAppCallbackController, cb: received FLOM START message, marked business phone number ${from} as connected`,
    );

    return;
  } catch (error) {
    logger.error(
      `WhatsAppCallbackController, cb: error processing FLOM START message from ${from}: ${error.message}`,
    );
    await Logics.sendWhatsAppMessage({
      to: from,
      from: Config.whatsAppPhoneNumber,
      message:
        "FLOM START message received, but there was an error processing your request. Please try again later.",
    });
    return;
  }
}

module.exports = handleStartMessage;
