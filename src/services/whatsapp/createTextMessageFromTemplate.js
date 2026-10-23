const { logger } = require("#infra");

const templates = require("./freeMessages");

const parameterMapping = {
  userName: "__USER_NAME__",
  productName: "__PRODUCT_NAME__",
  liveStreamId: "__LIVE_STREAM_ID__",
  auctionName: "__AUCTION_NAME__",
  auctionId: "__AUCTION_ID__",
  orderName: "__ORDER_NAME__",
  shippingStatus: "__SHIPPING_STATUS__",
  orderId: "__ORDER_ID__",
  slug: "__SLUG__",
  messageText: "__MESSAGE_TEXT__",
  urlStub: "__URL_STUB__",
  sellerName: "__SELLER_NAME__",
  buyerName: "__BUYER_NAME__",
  orderItems: "__ORDER_ITEMS__",
  orderPriceWithCurrency: "__ORDER_PRICE_WITH_CURRENCY__",
};

function createTextMessageFromTemplate({ to, template, ...params }) {
  if (!template || !templates[template]) {
    logger.error(`createTextMessageFromTemplate error, invalid template: ${template}`);
    return null;
  }

  const templatePattern = templates[template];

  const allParamNames = templatePattern.params || [];

  for (const param of allParamNames) {
    if (!params[param]) {
      logger.error(
        `createTextMessageFromTemplate error, missing parameter: ${param} for template: ${template}`,
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

  const data = {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body: text },
  };

  return data;
}

module.exports = createTextMessageFromTemplate;
