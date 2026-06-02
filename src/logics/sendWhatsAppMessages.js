"use strict";

const { logger } = require("#infra");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const getWhatsAppPrices = require("./getWhatsAppPrices");
const sendWhatsAppMessage = require("./sendWhatsAppMessage");
const makeFeeTransfer = require("./makeFeeTransfer");
const sendFlomPush = require("./sendFlomPush");
const { User, Notification } = require("#models");

const feeType = {
  goLive: "Live stream notification",
  sellerFollowup: "Seller follow-up",
  newDrop: "New drop notification",
  auctionReminder: "Auction reminder",
  secondChance: "Second chance notification",
  bookingConfirmation: "Booking confirmation",
  bookingReminder: "Booking reminder",
  shippingUpdate: "Shipping update",
  pendingPayment: "Pending payment reminder",
};

async function sendWhatsAppMessages({
  sender,
  senderId,
  receivers = [],
  receiverIds = [],
  message,
  template = null,
  userName,
  liveStreamId,
  auctionName,
  auctionId,
  shippingStatus,
  orderId,
  orderName,
  productName,
  messageType,
  location,
  file,
}) {
  try {
    if (!Config.enableWhatsApp) {
      logger.warn(
        "sendWhatsAppMessages, WhatsApp messaging is disabled, skipping sendWhatsAppMessages",
      );
      return [];
    }

    if (!sender && !senderId) {
      logger.error(
        "sendWhatsAppMessages error, missing sender information: sender or senderId: " +
          sender +
          ", " +
          senderId,
      );
      return [];
    }

    if (receivers.length === 0 && receiverIds.length === 0) {
      logger.error(
        "sendWhatsAppMessages error, missing receiver information: receivers or receiverIds: " +
          receivers +
          ", " +
          receiverIds,
      );
      return [];
    }

    if (!sender) {
      sender = await User.findById(senderId).lean();
    }

    if (
      template &&
      template !== "sellerFollowup" &&
      !sender.notificationOptions?.whatsApp?.enabled
    ) {
      logger.warn(
        `sendWhatsAppMessages, not sending WhatsApp messages, user has disabled WhatsApp notifications. userId: ${sender._id.toString()}`,
      );
      return [];
    }
    if (
      template &&
      template !== "sellerFollowup" &&
      (!sender.notificationOptions?.whatsApp || !sender.notificationOptions.whatsApp[template])
    ) {
      logger.warn(
        `sendWhatsAppMessages, not sending WhatsApp messages, user has disabled WhatsApp notifications for this template. userId: ${sender._id.toString()}, template: ${template}`,
      );
      return [];
    }

    if (!receivers || receivers.length === 0) {
      const isChatMessage = !template || template === "sellerFollowup";

      receivers = await User.find({
        _id: { $in: receiverIds },
        "isDeleted.value": false,
        ...(isChatMessage
          ? {}
          : {
              notificationSubscriptions: {
                $elemMatch: { userId: sender._id.toString(), whatsApp: true },
              },
            }),
      }).lean();
    }

    if (receivers.length === 0) {
      logger.warn(
        `sendWhatsAppMessages, no subscribed and undeleted receivers found. senderId: ${sender._id.toString()}, receiverIds: ${receiverIds.join(
          ",",
        )}`,
      );
      return [];
    }

    const prices = await getWhatsAppPrices({ countryCode: sender.countryCode });
    const price = Const.marketingTemplates.includes(template) ? prices.marketing : prices.utillity;

    const wamIds = [];

    let realPrice = receivers.reduce((acc, receiver) => {
      if (receiver.whatsApp?.windowExpiresAt && Date.now() < receiver.whatsApp.windowExpiresAt) {
        receiver.windowExpired = false;
        return acc; // No charge for messages within the 24-hour window
      }

      receiver.windowExpired = true;
      return acc + price;
    }, 0);

    if (sender.satsBalance < realPrice) {
      logger.warn(
        `sendWhatsAppMessages, not sending WhatsApp messages, insufficient balance. userId: ${sender._id.toString()}, balance: ${
          sender.satsBalance
        }, required: ${realPrice}`,
      );

      await User.findByIdAndUpdate(sender._id, { "notificationOptions.whatsApp.enabled": false });

      await Notification.create({
        title: "WhatsApp messaging disabled",
        text: "Your WhatsApp messages have been disabled due to insufficient balance. Please top up your balance to continue sending WhatsApp messages.",
        receiverIds: [sender._id.toString()],
        senderId: Config.flomSupportAgentId,
        notificationType: Const.notificationTypeLowGlobalBalance,
        created: Date.now(),
      });

      await sendFlomPush({
        senderId: Config.flomSupportAgentId,
        receiverUser: sender,
        message: `Your WhatsApp messages have been disabled due to insufficient balance.`,
        messageiOs: `Your WhatsApp messages have been disabled due to insufficient balance.`,
        pushType: Const.pushTypeLowGlobalBalance,
        isMuted: false,
      });
    } else {
      let i = 0;

      for (const receiver of receivers) {
        const wamid = await sendWhatsAppMessage({
          to: receiver.phoneNumber,
          from: sender.phoneNumber,
          message,
          template,
          userName,
          liveStreamId,
          auctionName,
          auctionId,
          shippingStatus,
          orderId,
          orderName,
          productName,
          isFreeMessage: !receiver.windowExpired && Const.marketingTemplates.includes(template),
          messageType,
          location,
          file,
        });

        if (wamid) {
          wamIds.push(wamid);
        } else {
          logger.error(
            `sendWhatsAppMessages, failed to send WhatsApp message to receiver: ${receiver._id.toString()}, phoneNumber: ${
              receiver.phoneNumber
            }`,
          );
          realPrice -= price;
        }

        i++;

        if (i % 5 === 0) {
          await Utils.sleep(100); // Adding delay to avoid hitting rate limits
        }
      }

      if (realPrice > 0) {
        await makeFeeTransfer({
          fee: realPrice,
          feeType: feeType[template],
          sender: sender,
          numberOfWaMessages: receivers.length,
        });
      }
    }

    return wamIds;
  } catch (error) {
    logger.error("sendWhatsAppMessages error", error);
    return [];
  }
}

module.exports = sendWhatsAppMessages;
