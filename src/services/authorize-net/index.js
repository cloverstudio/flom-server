module.exports = Object.freeze({
  addPaymentMethod: require("./addPaymentMethod"),
  createPaymentProfile: require("./createPaymentProfile"),
  deleteSavedPaymentMethod: require("./deleteSavedPaymentMethod"),
  getSavedPaymentMethods: require("./getSavedPaymentMethods"),
  getTransactionDetails: require("./getTransactionDetails"),
  voidTransaction: require("./voidOrRefundTransaction").voidTransaction,
  refundTransaction: require("./voidOrRefundTransaction").refundTransaction,
});
