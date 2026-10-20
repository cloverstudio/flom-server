const { logger } = require("#infra");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const Logics = require("#logics");
const { VerificationRequest, Order } = require("#models");

async function confirmOrderCode({ orderToken, code }) {
  const order = await Order.findOne({ orderToken }).lean();

  if (!order) {
    return { code: Const.responsecodeOrderNotFound, msg: "Order not found" };
  }

  const buyerPhoneNumber = order.buyer.phoneNumber;

  const verificationRequest = await VerificationRequest.findOne({
    phoneNumber: buyerPhoneNumber,
    code,
  }).lean();

  if (!verificationRequest) {
    return { code: Const.responsecodeInvalidCode, msg: "Invalid code" };
  }

  if (verificationRequest.expiresAt && verificationRequest.expiresAt < Date.now()) {
    return { code: Const.responsecodeCodeExpired, msg: "Code has expired" };
  }

  if (verificationRequest.attempts >= 3) {
    return { code: Const.responsecodeTooManyAttempts, msg: "Too many attempts" };
  }

  return { order, success: true };
}

module.exports = confirmOrderCode;
