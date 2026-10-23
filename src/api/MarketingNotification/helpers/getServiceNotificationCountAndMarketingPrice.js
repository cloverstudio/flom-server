const { WhatsApp: W } = require("#services");
const Utils = require("#utils");
const generateWhatsAppMessageParts = require("./generateWhatsAppMessageParts");

async function getServiceNotificationCountAndMarketingPrice({ subscribers, notification, user }) {
  const { hasFreeText, hasPaidText, hasVoiceNote } = await generateWhatsAppMessageParts({
    notification,
  });

  let freeCount = 0,
    paidCount = 0;

  const userCountryCode =
    user.countryCode || Utils.getCountryCodeFromPhoneNumber({ phoneNumber: user.phoneNumber });
  const priceMap = await W.getPriceMap(userCountryCode);

  const localCurrency = priceMap.localCurrency;
  let priceInSats = 0,
    priceInLocalCurrency = 0;

  for (const s of subscribers) {
    let type;

    if (s.whatsApp?.windowExpiresAt && s.whatsApp.windowExpiresAt > Date.now()) {
      if (!hasFreeText && !hasVoiceNote) {
        continue;
      }

      if (hasFreeText && hasVoiceNote) {
        type = "service";
        freeCount++;
      } else if (hasFreeText) {
        type = "service_from_template";
      } else if (hasVoiceNote) {
        type = "service";
      }
    } else {
      if (!hasPaidText) {
        continue;
      }

      type = "template";

      const subscriberCountryCode =
        s.countryCode || Utils.getCountryCodeFromPhoneNumber({ phoneNumber: s.phoneNumber });
      priceInSats += priceMap[subscriberCountryCode].marketing;
      priceInLocalCurrency += priceMap[subscriberCountryCode].marketingLocal;
    }

    if (type !== "template") {
      freeCount++;
    } else {
      paidCount++;
    }
  }

  return {
    serviceMessagesCount: freeCount,
    paidCount,
    priceInSats,
    priceInLocalCurrency,
    localCurrency,
  };
}

module.exports = getServiceNotificationCountAndMarketingPrice;
