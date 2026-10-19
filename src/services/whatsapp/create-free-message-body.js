const { Config, Const } = require("#config");
const { logger } = require("#infra");

const templates = require("./free-messages");

const parameterMapping = {
  userName: "__USER_NAME__",
  productName: "__PRODUCT_NAME__",
  liveStreamId: "__LIVE_STREAM_ID__",
  auctionName: "__AUCTION_NAME__",
  auctionId: "__AUCTION_ID__",
  orderName: "__ORDER_NAME__",
  shippingStatus: "__SHIPPING_STATUS__",
  orderId: "__ORDER_ID__",
  sellerName: "__SELLER_NAME__",
  buyerName: "__BUYER_NAME__",
  orderItems: "__ORDER_ITEMS__",
  orderPriceWithCurrency: "__ORDER_PRICE_WITH_CURRENCY__",
};

const deepLink = {
  order: `https://flom.app/order?id=`,
  auction: `https://flom.app/auction?id=`,
  liveStream: `https://flom.app/livestream?id=`,
  product: `https://flom.app/product?id=`,
};

function createFreeMessageBody({ template, ...params }) {
  if (!template || !templates[template]) {
    logger.error(`createFreeMessageBody error, invalid template: ${template}`);
    return null;
  }

  const templatePattern = templates[template];

  const allParamNames = templatePattern.params || [];

  for (const param of allParamNames) {
    if (!params[param]) {
      logger.error(
        `createFreeMessageBody error, missing parameter: ${param} for template: ${template}`,
      );
      return null;
    }
  }

  let text = templatePattern.text || "";

  for (const param of allParamNames) {
    const toReplace = parameterMapping[param];
    if (toReplace) {
      const regex = new RegExp(toReplace, "g");
      text = text.replace(regex, params[param]);
    }
  }

  return text;
}

module.exports = createFreeMessageBody;
