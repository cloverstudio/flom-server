"use strict";

const { logger } = require("#infra");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const getWhatsAppPrices = require("./getWhatsAppPrices");
const sendWhatsAppMessage = require("./sendWhatsAppMessage");
const makeFeeTransfer = require("./makeFeeTransfer");
const sendFlomPush = require("./sendFlomPush");
const { User, Notification } = require("#models");

const templateMap = {
  seller_followup: "sellerFollowup",
  go_live: "goLive",
  new_drop: "newDrop",
  auction_reminder: "auctionReminder",
  booking_confirmation: "bookingConfirmation",
  booking_reminder: "bookingReminder",
  second_chance: "secondChance",
  shipping_update: "shippingUpdate",
  pending_payment: "pendingPayment",
  unknown_recipient_notice: "unknownRecipientNotice",
  order_issue_seller: "orderIssueSeller",
  buyer_confirmed_seller: "buyerConfirmedSeller",
  payment_received_seller: "paymentReceivedSeller",
  new_order_seller: "newOrderSeller",
  order_payment_released_buyer: "orderPaymentReleasedBuyer",
  order_in_progress_buyer: "orderInProgressBuyer",
  payment_received_buyer: "paymentReceivedBuyer",
  order_confirmed_buyer: "orderConfirmedBuyer",
  engage_v1: "engageV1",
  engage_with_image_v1: "engageWithImageV1",
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
      template !== "seller_followup" &&
      template !== "engage_v1" &&
      template !== "engage_with_image_v1" &&
      !sender.notificationOptions?.whatsApp?.enabled
    ) {
      logger.warn(
        `sendWhatsAppMessages, not sending WhatsApp messages, user has disabled WhatsApp notifications. userId: ${sender._id.toString()}`,
      );
      return [];
    }
    if (
      template &&
      template !== "seller_followup" &&
      template !== "engage_v1" &&
      template !== "engage_with_image_v1" &&
      (!sender.notificationOptions?.whatsApp ||
        !sender.notificationOptions.whatsApp[templateMap[template]])
    ) {
      logger.warn(
        `sendWhatsAppMessages, not sending WhatsApp messages, user has disabled WhatsApp notifications for this template. userId: ${sender._id.toString()}, template: ${template}`,
      );
      return [];
    }

    if (!receivers || receivers.length === 0) {
      const isChatMessage = !template || template === "seller_followup";

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
    const price = Const.waMarketingTemplates.includes(template) ? prices.marketing : prices.utility;

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
          isFreeMessage: !receiver.windowExpired && Const.waMarketingTemplates.includes(template),
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
          template,
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
