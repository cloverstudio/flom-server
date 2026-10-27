"use strict";

const { Const, Config } = require("#config");
const { Product, User } = require("#models");

async function generateWhatsAppMessageParts({ notification }) {
  const { title, text, voiceNote, contentType, contentId } = notification;

  let baseText = "",
    image,
    headerImageUrl,
    headerText,
    voiceUrl,
    contentUrl,
    urlStub;

  headerText = !title ? "New marketing notification" : title.trim();

  if (text) {
    baseText += text;
  }
  if (contentType == Const.marketingNotificationsContentTypeProfile) {
    const user = await User.findById(contentId).lean();
    const safeUserName = encodeURIComponent(user.userName);

    const profileUrl = `https://flom.app/profile?username=${safeUserName}`;
    urlStub = `profile?username=${safeUserName}`;
    contentUrl = profileUrl;
  } else if (contentType == Const.marketingNotificationsContentTypeMarketplace) {
    const user = await User.findById(contentId).lean();
    const safeUserName = encodeURIComponent(user.userName);

    const profileUrl = `https://flom.app/profile?username=${safeUserName}`;
    urlStub = `profile?username=${safeUserName}`;
    contentUrl = profileUrl;
  } else {
    const product = await Product.findById(contentId).lean();

    // https://discover.flom.app/discover/details/6a0cc2d26108b505f7a04abd

    contentUrl = `https://flom.app/product?id=${product._id.toString()}`;
    urlStub = `product?id=${product._id.toString()}`;

    if (product.type === Const.productTypeService || product.type === Const.productTypeProduct) {
      let price = null;
      if (product.originalPrice.value && product.originalPrice.value > 0) {
        price = `${product.originalPrice.value} ${product.originalPrice.currency}`;
      } else if (product.originalPrice.minValue && product.originalPrice.minValue > 0) {
        price = `${product.originalPrice.minValue}-${product.originalPrice.maxValue} ${product.originalPrice.currency}`;
      }
      baseText += ` - ${product.name} (${price})`;
      image = product.file?.[0]?.thumb;
    } else {
      baseText += ` - ${product.name}`;
      image = product.file?.[0]?.thumb;
    }
  }

  if (image) {
    headerImageUrl = Config.storageUrl + "/" + image.nameOnServer;
  }

  if (voiceNote) {
    voiceUrl = Config.storageUrl + "/" + voiceNote.oggName;
  }

  return {
    baseText,
    contentUrl,
    hasFreeText: !!text || !!contentUrl,
    hasPaidText: !!text,
    hasVoiceNote: !!voiceUrl,
    headerImageUrl,
    headerText,
    voiceUrl,
    urlStub,
  };
}

module.exports = generateWhatsAppMessageParts;
