module.exports = {
  sellerFollowup: {
    name: "seller_followup",
    type: "utility",
    params: ["userName", "productName"],
  },
  goLive: {
    name: "go_live",
    type: "marketing",
    params: ["userName", "liveStreamId"],
  },
  newDrop: { name: "new_drop", type: "marketing", params: [], buttonParams: [] },
  auctionReminder: {
    name: "auction_reminder",
    type: "marketing",
    params: ["auctionName", "liveStreamId"],
    text: 'Auction "__AUCTION_NAME__" is about to start!\nClick the link to join the auction live stream!\nhttps://flom.app/livestream?id=__LIVE_STREAM_ID__',
  },
  bookingConfirmation: {
    name: "booking_confirmation",
    type: "utility",
    params: [],
  },
  bookingReminder: { name: "booking_reminder", type: "utility", params: [] },
  secondChance: {
    name: "second_chance",
    type: "marketing",
    params: ["auctionName", "auctionId"],
    text: 'Winner of auction "__AUCTION_NAME__" has missed his payment window so you are the new winner! Click the link to accept and pay!\nhttps://flom.app/auction?id=__AUCTION_ID__',
  },
  shippingUpdate: {
    name: "shipping_update",
    type: "utility",
    params: ["orderName", "shippingStatus", "orderId"],
    text: "Your order __ORDER_NAME__ has a new shipping status: __SHIPPING_STATUS__\nClick the link to see more info!\nhttps://flom.app/order?id=__ORDER_ID__",
  },
  pendingPayment: {
    name: "pending_payment",
    type: "utility",
    params: ["orderName", "orderId"],
    text: `Please do not forget to pay for your order: __ORDER_NAME__\nClick the link to pay!\nhttps://flom.app/order?id=__ORDER_ID__`,
  },
  unknownRecipientNotice: {
    name: "unknown_recipient_notice",
    type: "utility",
    params: [],
  },

  orderIssueSeller: {
    name: "order_issue_seller",
    type: "utility",
    params: ["sellerName", "buyerName", "orderItems", "orderId"],
    text: "Hi __SELLER_NAME__, __BUYER_NAME__ has raised an issue with order for item __ORDER_ITEMS__ . Nothing to worry about — let's sort it. Click the link to view the order and respond:\nhttps://flom.app/order?id=__ORDER_ID__",
  },
  buyerConfirmedSeller: {
    name: "buyer_confirmed_seller",
    type: "utility",
    params: ["sellerName", "buyerName", "orderItems", "orderPriceWithCurrency", "orderId"],
    text: "Good news __SELLER_NAME__ — __BUYER_NAME__ confirmed delivery for item __ORDER_ITEMS__ and the payment of __ORDER_PRICE_WITH_CURRENCY__ has been released to you. Click the link to view the order receipt:\nhttps://flom.app/order_receipt?id=__ORDER_ID__",
  },
  paymentReceivedSeller: {
    name: "payment_received_seller",
    type: "utility",
    params: ["sellerName", "buyerName", "orderItems", "orderId"],
    text: "Hi __SELLER_NAME__, payment for __BUYER_NAME__'s order (__ORDER_ITEMS__) has been received and is held safely by Flom. You can go ahead. You'll be paid once the order is complete. Click the link to view the order:\nhttps://flom.app/order?id=__ORDER_ID__",
  },
  newOrderSeller: {
    name: "new_order_seller",
    type: "utility",
    params: ["sellerName", "buyerName", "orderItems", "orderPriceWithCurrency", "orderId"],
    text: "Hi __SELLER_NAME__, you have a new order. __BUYER_NAME__ wants __ORDER_ITEMS__ (__ORDER_PRICE_WITH_CURRENCY__). Click the link to view the order:\nhttps://flom.app/order?id=__ORDER_ID__",
  },

  orderPaymentReleasedBuyer: {
    name: "order_payment_released_buyer",
    type: "utility",
    params: ["buyerName", "sellerName", "orderId"],
    text: "Thanks __BUYER_NAME__. Your order from __SELLER_NAME__ is complete and payment has been released. Click the link to view the order receipt:\nhttps://flom.app/order_receipt?id=__ORDER_ID__",
  },
  orderInProgressBuyer: {
    name: "order_in_progress_buyer",
    type: "utility",
    params: ["sellerName", "orderId"],
    text: "Update on your order from __SELLER_NAME__. Click the link to view the order:\nhttps://flom.app/order?id=__ORDER_ID__",
  },
  paymentReceivedBuyer: {
    name: "payment_received_buyer",
    type: "utility",
    params: ["buyerName", "orderPriceWithCurrency", "orderItems", "sellerName", "orderId"],
    text: "Good news __BUYER_NAME__ — your payment of __ORDER_PRICE_WITH_CURRENCY__ for __ORDER_ITEMS__ has been received and is held safely. __SELLER_NAME__ will be told to go ahead.\nYou're protected until your order is complete.\nClick the link to view the order:\nhttps://flom.app/order_receipt?id=__ORDER_ID__",
  },
  orderConfirmedBuyer: {
    name: "order_confirmed_buyer",
    type: "utility",
    params: ["buyerName", "sellerName", "orderItems", "orderPriceWithCurrency", "orderId"],
    text: "Hi __BUYER_NAME__, your order from __SELLER_NAME__ is confirmed: __ORDER_ITEMS__ (__ORDER_PRICE_WITH_CURRENCY__). We'll let you know the moment your payment is received. Click below to see order receipt:\nhttps://flom.app/order_receipt?id=__ORDER_ID__",
  },
  engageV1: {
    name: "engage_v1",
    type: "marketing",
    params: ["slug", "messageText", "urlStub"],
    text: "@__SLUG__: __MESSAGE_TEXT__\n\nhttps://flom.app/__URL_STUB__",
  },
  engageWithImageV1: {
    name: "engage_with_image_v1",
    type: "marketing",
    params: ["slug", "messageText", "urlStub"],
    text: "@__SLUG__: __MESSAGE_TEXT__\n\nhttps://flom.app/__URL_STUB__",
  },
};
