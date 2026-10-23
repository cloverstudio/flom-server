module.exports = {
  seller_followup: {
    name: "seller_followup",
    type: "utility",
    params: ["userName", "productName"],
  },
  go_live: {
    name: "go_live",
    type: "marketing",
    params: ["userName", "liveStreamId"],
  },
  new_drop: { name: "new_drop", type: "marketing", params: [], buttonParams: [] },
  auction_reminder: {
    name: "auction_reminder",
    type: "marketing",
    params: ["auctionName", "liveStreamId"],
    text: 'Auction "__AUCTION_NAME__" is about to start!\nClick the link to join the auction live stream!\nhttps://flom.app/livestream?id=__LIVE_STREAM_ID__',
  },
  booking_confirmation: {
    name: "booking_confirmation",
    type: "utility",
    params: [],
  },
  booking_reminder: { name: "booking_reminder", type: "utility", params: [] },
  second_chance: {
    name: "second_chance",
    type: "marketing",
    params: ["auctionName", "auctionId"],
    text: 'Winner of auction "__AUCTION_NAME__" has missed his payment window so you are the new winner! Click the link to accept and pay!\nhttps://flom.app/auction?id=__AUCTION_ID__',
  },
  shipping_update: {
    name: "shipping_update",
    type: "utility",
    params: ["orderName", "shippingStatus", "orderId"],
    text: "Your order __ORDER_NAME__ has a new shipping status: __SHIPPING_STATUS__\nClick the link to see more info!\nhttps://flom.app/order?id=__ORDER_ID__",
  },
  pending_payment: {
    name: "pending_payment",
    type: "utility",
    params: ["orderName", "orderId"],
    text: `Please do not forget to pay for your order: __ORDER_NAME__\nClick the link to pay!\nhttps://flom.app/order?id=__ORDER_ID__`,
  },
  unknown_recipient_notice: {
    name: "unknown_recipient_notice",
    type: "utility",
    params: [],
  },

  order_issue_seller: {
    name: "order_issue_seller",
    type: "utility",
    params: ["sellerName", "buyerName", "orderItems", "orderId"],
    text: "Hi __SELLER_NAME__, __BUYER_NAME__ has raised an issue with order for item __ORDER_ITEMS__ . Nothing to worry about — let's sort it. Click the link to view the order and respond:\nhttps://flom.app/order?id=__ORDER_ID__",
  },
  buyer_confirmed_seller: {
    name: "buyer_confirmed_seller",
    type: "utility",
    params: ["sellerName", "buyerName", "orderItems", "orderPriceWithCurrency", "orderId"],
    text: "Good news __SELLER_NAME__ — __BUYER_NAME__ confirmed delivery for item __ORDER_ITEMS__ and the payment of __ORDER_PRICE_WITH_CURRENCY__ has been released to you. Click the link to view the order receipt:\nhttps://flom.app/order_receipt?id=__ORDER_ID__",
  },
  payment_received_seller: {
    name: "payment_received_seller",
    type: "utility",
    params: ["sellerName", "buyerName", "orderItems", "orderId"],
    text: "Hi __SELLER_NAME__, payment for __BUYER_NAME__'s order (__ORDER_ITEMS__) has been received and is held safely by Flom. You can go ahead. You'll be paid once the order is complete. Click the link to view the order:\nhttps://flom.app/order?id=__ORDER_ID__",
  },
  new_order_seller: {
    name: "new_order_seller",
    type: "utility",
    params: ["sellerName", "buyerName", "orderItems", "orderPriceWithCurrency", "orderId"],
    text: "Hi __SELLER_NAME__, you have a new order. __BUYER_NAME__ wants __ORDER_ITEMS__ (__ORDER_PRICE_WITH_CURRENCY__). Click the link to view the order:\nhttps://flom.app/order?id=__ORDER_ID__",
  },

  order_payment_released_buyer: {
    name: "order_payment_released_buyer",
    type: "utility",
    params: ["buyerName", "sellerName", "orderId"],
    text: "Thanks __BUYER_NAME__. Your order from __SELLER_NAME__ is complete and payment has been released. Click the link to view the order receipt:\nhttps://flom.app/order_receipt?id=__ORDER_ID__",
  },
  order_in_progress_buyer: {
    name: "order_in_progress_buyer",
    type: "utility",
    params: ["sellerName", "orderId"],
    text: "Update on your order from __SELLER_NAME__. Click the link to view the order:\nhttps://flom.app/order?id=__ORDER_ID__",
  },
  payment_received_buyer: {
    name: "payment_received_buyer",
    type: "utility",
    params: ["buyerName", "orderPriceWithCurrency", "orderItems", "sellerName", "orderId"],
    text: "Good news __BUYER_NAME__ — your payment of __ORDER_PRICE_WITH_CURRENCY__ for __ORDER_ITEMS__ has been received and is held safely. __SELLER_NAME__ will be told to go ahead.\nYou're protected until your order is complete.\nClick the link to view the order:\nhttps://flom.app/order_receipt?id=__ORDER_ID__",
  },
  order_confirmed_buyer: {
    name: "order_confirmed_buyer",
    type: "utility",
    params: ["buyerName", "sellerName", "orderItems", "orderPriceWithCurrency", "orderId"],
    text: "Hi __BUYER_NAME__, your order from __SELLER_NAME__ is confirmed: __ORDER_ITEMS__ (__ORDER_PRICE_WITH_CURRENCY__). We'll let you know the moment your payment is received. Click below to see order receipt:\nhttps://flom.app/order_receipt?id=__ORDER_ID__",
  },
  engage_v1: {
    name: "engage_v1",
    type: "marketing",
    params: ["slug", "messageText", "urlStub"],
    text: "@__SLUG__: __MESSAGE_TEXT__\n\nhttps://flom.app/__URL_STUB__",
  },
  engage_with_image_v1: {
    name: "engage_with_image_v1",
    type: "marketing",
    params: ["slug", "messageText", "urlStub"],
    text: "@__SLUG__: __MESSAGE_TEXT__\n\nhttps://flom.app/__URL_STUB__",
  },
};
