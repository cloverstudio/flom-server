const { logger } = require("#infra");
const { WhatsApp: W } = require("#services");
const Utils = require("#utils");
const Logics = require("#logics");
const generateWhatsAppMessageParts = require("./generateWhatsAppMessageParts");

async function sendWhatsAppMessages({
  subscribers,
  notification,
  user,
  sendServiceMessages = true,
}) {
  const {
    baseText,
    contentUrl,
    hasFreeText,
    hasPaidText,
    hasVoiceNote,
    headerImageUrl,
    headerText,
    voiceUrl,
    urlStub,
  } = await generateWhatsAppMessageParts({ notification });

  const userCountryCode =
    user.countryCode || Utils.getCountryCodeFromPhoneNumber({ phoneNumber: user.phoneNumber });
  const priceMap = await W.getPriceMap(userCountryCode);

  let paidCount = 0,
    priceInSats = 0;

  let paidMsg = baseText;
  let freeMsg = "";
  if (user.slug) {
    freeMsg += "@" + user.slug + ":";
  }
  if (headerText) {
    freeMsg += " " + headerText;
  }
  if (baseText) {
    freeMsg += "\n" + baseText;
  }
  if (contentUrl) {
    freeMsg += "\n" + contentUrl;
  }

  let i = 0;
  for (const s of subscribers) {
    let type, template;

    if (s.whatsApp?.windowExpiresAt && s.whatsApp.windowExpiresAt > Date.now()) {
      if (!hasFreeText && !hasVoiceNote) {
        continue;
      }

      if (!sendServiceMessages) {
        continue;
      }

      if (hasFreeText && hasVoiceNote) {
        const r = await W.send({
          to: s.phoneNumber,
          from: user.phoneNumber,
          type: "service_from_template",
          template: "engage_v1",
          slug: user.slug,
          messageText: freeMsg,
          urlStub,
        });

        if (!r) {
          continue;
        }

        type = "service";
      } else if (hasFreeText) {
        type = "service_from_template";
        template = "engage_v1";
      } else if (hasVoiceNote) {
        type = "service";
      }
    } else {
      if (!hasPaidText) {
        continue;
      }

      type = "template";
      if (headerImageUrl) {
        template = "engage_with_image_v1";
        if (headerText) {
          paidMsg = headerText + "\n" + paidMsg;
        }
      } else {
        template = "engage_v1";
      }
    }

    if (i % 50 === 0) {
      await Utils.sleep(2000); // Pause for 2 seconds every 50 messages to avoid rate limits
    }

    if (type === "template") {
      const subscriberCountryCode =
        s.countryCode || Utils.getCountryCodeFromPhoneNumber({ phoneNumber: s.phoneNumber });

      if (!priceMap[subscriberCountryCode]?.marketing) {
        logger.error(
          `MarketingNotificationsHelper - sendWhatsAppMessages, no marketing price for subscriber country code: ${subscriberCountryCode}`,
        );
        continue;
      }
    }

    const r = await W.send({
      to: s.phoneNumber,
      from: user.phoneNumber,
      type,
      template,
      message: type === "template" ? paidMsg : freeMsg,
      messageText: type === "template" ? paidMsg : freeMsg,
      contentUrl,
      headerText,
      headerImageUrl,
      voiceUrl,
      urlStub,
      slug: user.slug,
    });

    if (r && type === "template") {
      const subscriberCountryCode =
        s.countryCode || Utils.getCountryCodeFromPhoneNumber({ phoneNumber: s.phoneNumber });

      priceInSats += priceMap[subscriberCountryCode]?.marketing;

      paidCount++;
    }

    i++;
  }

  if (paidCount > 0) {
    const t = await Logics.makeFeeTransfer({
      fee: priceInSats,
      template: "engage_v1",
      sender: user,
      numberOfWaMessages: paidCount,
    });

    if (user.pushToken) {
      Utils.callPushService({
        pushToken: user.pushToken,
        isVoip: false,
        unreadCount: 1,
        isMuted: false,
        payload: {
          pushType: 801,
          info: {
            transferId: t._id.toString(),
            transferType: t.transferType,
            paymentMethodType: t.paymentMethodType,
            status: t.status,
            phoneNumber: t.receiverPhoneNumber,
            message: `You paid ${priceInSats} sats Marketing notification fee (${paidCount} WhatsApp messages)`,
            isNigerian: false,
            isGroup: false,
          },
        },
      });
    }
  }
}

module.exports = sendWhatsAppMessages;
