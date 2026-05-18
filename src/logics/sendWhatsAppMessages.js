"use strict";

const { logger } = require("#infra");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const getWhatsAppPrices = require("./getWhatsAppPrices");
const sendWhatsAppMessage = require("./sendWhatsAppMessage");
const makeFeeTransfer = require("./makeFeeTransfer");
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
  mentionSlug,
}) {
  try {
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

    if (!template) {
      logger.error(
        "sendWhatsAppMessages error, missing template information: template: " + template,
      );
      return [];
    }

    if (!sender) {
      sender = await User.findById(senderId).lean();
    }

    if (!sender.notificationOptions?.whatsApp?.enabled) {
      logger.warn(
        `sendWhatsAppMessages, not sending WhatsApp messages, user has disabled WhatsApp notifications. userId: ${sender._id.toString()}`,
      );
      return [];
    }
    if (!sender.notificationOptions?.whatsApp || !sender.notificationOptions.whatsApp[template]) {
      logger.warn(
        `sendWhatsAppMessages, not sending WhatsApp messages, user has disabled WhatsApp notifications for this template. userId: ${sender._id.toString()}, template: ${template}`,
      );
      return [];
    }

    mentionSlug = sender.whatsApp?.mentionSlug || mentionSlug; // Use sender's mention slug if available

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
        `sendWhatsAppMessages, no suubscribed and undeleted receivers found. senderId: ${sender._id.toString()}, receiverIds: ${receiverIds.join(
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
        title: "WhatsApp notifications disabled",
        text: "Your WhatsApp notifications have been disabled due to insufficient balance. Please top up your balance to continue sending WhatsApp notifications.",
        receiverIds: [sender._id.toString()],
        senderId: Config.flomSupportAgentId,
        notificationType: Const.notificationTypeLowGlobalBalance,
        created: Date.now(),
      });
    } else {
      let i = 0;

      for (const receiver of receivers) {
        const wamid = await sendWhatsAppMessage({
          to: receiver.phoneNumber,
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
          mentionSlug,
          isFreeMessage: !receiver.windowExpired && Const.marketingTemplates.includes(template),
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
          await Utils.wait(0.1); // Adding delay to avoid hitting rate limits
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
