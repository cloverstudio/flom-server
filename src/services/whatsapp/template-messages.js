module.exports = {
  sellerFollowup: {
    name: "seller_followup",
    type: "utility",
    textParams: ["userName", "productName"],
    buttonParams: [],
  },
  goLive: {
    name: "go_live",
    type: "marketing",
    textParams: ["userName"],
    buttonParams: ["liveStreamId"],
  },
  newDrop: { name: "new_drop", type: "marketing", textParams: [], buttonParams: [] },
  auctionReminder: {
    name: "auction_reminder",
    type: "marketing",
    textParams: ["auctionName", "auctionId"],
    buttonParams: ["liveStreamId"],
  },
  bookingConfirmation: {
    name: "booking_confirmation",
    type: "utility",
    textParams: [],
    buttonParams: [],
  },
  bookingReminder: { name: "booking_reminder", type: "utility", textParams: [], buttonParams: [] },
  secondChance: {
    name: "second_chance",
    type: "marketing",
    textParams: ["auctionName"],
    buttonParams: ["auctionId"],
  },
  shippingUpdate: {
    name: "shipping_update",
    type: "utility",
    textParams: ["orderName", "shippingStatus"],
    buttonParams: ["orderId"],
  },
  pendingPayment: {
    name: "pending_payment",
    type: "utility",
    textParams: ["orderName"],
    buttonParams: ["orderId"],
  },
  unknownRecipientNotice: {
    name: "unknown_recipient_notice",
    type: "utility",
    textParams: [],
    buttonParams: [],
  },

  orderIssueSeller: {
    name: "order_issue_seller",
    type: "utility",
    textParams: ["sellerName", "buyerName", "orderItems"],
    buttonParams: ["orderId"],
  },
  buyerConfirmedSeller: {
    name: "buyer_confirmed_seller",
    type: "utility",
    textParams: ["sellerName", "buyerName", "orderItems", "orderPriceWithCurrency"],
    buttonParams: ["orderId"],
  },
  paymentReceivedSeller: {
    name: "payment_received_seller",
    type: "utility",
    textParams: ["sellerName", "buyerName", "orderItems"],
    buttonParams: ["orderId"],
  },
  newOrderSeller: {
    name: "new_order_seller",
    type: "utility",
    textParams: ["sellerName", "buyerName", "orderItems", "orderPriceWithCurrency"],
    buttonParams: ["orderId"],
  },

  orderPaymentReleasedBuyer: {
    name: "order_payment_released_buyer",
    type: "utility",
    textParams: ["buyerName", "sellerName"],
    buttonParams: ["orderId"],
  },
  orderInProgressBuyer: {
    name: "order_in_progress_buyer",
    type: "utility",
    textParams: ["sellerName"],
    buttonParams: ["orderId"],
  },
  paymentReceivedBuyer: {
    name: "payment_received_buyer",
    type: "utility",
    textParams: ["buyerName", "orderPriceWithCurrency", "orderItems", "sellerName"],
    buttonParams: ["orderId"],
  },
  orderConfirmedBuyer: {
    name: "order_confirmed_buyer",
    type: "utility",
    textParams: ["buyerName", "sellerName", "orderItems", "orderPriceWithCurrency"],
    buttonParams: ["orderId"],
  },
};
