"use strict";

const { Const, Config } = require("#config");
const { Product, User } = require("#models");

async function generateWhatsAppMessage({ notification }) {
  const { title, text, voiceNote, contentType, contentId } = notification;

  let baseText = "",
    image,
    imageUrl,
    voiceUrl,
    contentUrl;

  if (title) {
    baseText = title + "\n";
  }
  if (text) {
    baseText += text + "\n";
  }
  if (contentType == Const.marketingNotificationsContentTypeProfile) {
    const user = await User.findById(contentId).lean();

    // https://discover.flom.app/discover/user-profile/moshadetoro
    // TODO: When profile urls uzpdated update them here as well

    const profileUrl = `${Config.discoverUrl}/discover/user-profile/${user.userName}`;
    contentUrl = profileUrl;
  } else if (contentType == Const.marketingNotificationsContentTypeMarketplace) {
    const user = await User.findById(contentId).lean();

    // https://discover.flom.app/discover/user-profile/moshadetoro
    // TODO: When profile urls uzpdated update them here as well

    const profileUrl = `${Config.discoverUrl}/discover/user-profile/${user.userName}?type=5`;
    contentUrl = profileUrl;
  } else {
    const product = await Product.findById(contentId).lean();

    // https://discover.flom.app/discover/details/6a0cc2d26108b505f7a04abd

    contentUrl = `${Config.discoverUrl}/discover/details/${product._id.toString()}`;

    if (product.type === Const.productTypeService || product.type === Const.productTypeProduct) {
      const price = `${product.originalPrice.value} ${product.originalPrice.currency}`;
      baseText += `${product.name} - ${price}`;
      image = product.file?.[0]?.thumb;
    } else {
      baseText += `${product.name}`;
      image = product.file?.[0]?.thumb;
    }
  }

  if (image) {
    imageUrl = Config.storageUrl + "/" + image.nameOnServer;
  }

  if (voiceNote) {
    voiceUrl = Config.storageUrl + "/" + voiceNote.oggName;
  }

  return {
    free: `${baseText}${contentUrl}`,
    paid: { baseText, contentUrl },
    hasText: !!text,
    imageUrl,
    voiceUrl,
  };
}

module.exports = generateWhatsAppMessage;
