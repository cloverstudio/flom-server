"use strict";

const { DateTime } = require("luxon");
const { logger, redis } = require("#infra");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { User, Transfer, Order, Auction } = require("#models");
const { authorizeNet } = require("#services");

let conversionRates = { rates: null, lastUpdated: 0 };

async function checkToken(token, socket, addToUserSockets = false) {
  let userId = await redis.get(Const.redisKeyAccessToken + token);

  if (!userId) {
    const user = await User.findOne({ "token.token": token }).lean();
    if (!user) {
      return null;
    }

    userId = user._id.toString();

    await redis.set(Const.redisKeyAccessToken + token, userId, 60 * 60 * 48);
  }

  if (addToUserSockets) {
    let userSockets = await redis.get(Const.redisKeyAuctionsUserId + userId);

    if (!userSockets) {
      userSockets = [];
    }
    userSockets = userSockets.filter(
      (s) => s.socketId !== socket.id && s.connected > Date.now() - 1000 * 60 * 60 * 48,
    );

    userSockets.push({ socketId: socket.id, connected: Date.now() });
    await redis.set(Const.redisKeyAuctionsUserId + userId, userSockets);
  }

  return userId;
}

async function handlePayment({ auction }) {
  try {
    if (!auction) {
      logger.warn("handlePayment error: missing auction");
      return;
    }

    const sellerId = auction.sellerId;
    const bid = auction.winningBid?.bid;
    const user = auction.winningBid?.user;

    if (!user || !bid) {
      logger.warn("handlePayment error: missing user or bid in auction: " + auction._id.toString());
      return;
    }

    const sender = await User.findById(user._id).lean();
    const receiver = await User.findById(sellerId).lean();

    const originalPrice = { ...bid };
    delete originalPrice.valueInSats;

    const base = DateTime.now();
    const expirationDate = base.plus({ minutes: Const.orderExpirationTime }).toUTC().toMillis();

    const order = await Order.create({
      seller: {
        _id: receiver._id.toString(),
        name: receiver.name,
        userName: receiver.userName,
        phoneNumber: receiver.phoneNumber,
        created: receiver.created,
        avatar: receiver.avatar,
      },
      buyer: {
        _id: sender._id.toString(),
        name: sender.name,
        userName: sender.userName,
        phoneNumber: sender.phoneNumber,
        created: sender.created,
        avatar: sender.avatar,
      },
      products: [{ quantity: auction.quantity, ...auction.product }],
      auctionId: auction._id.toString(),
      paymentMethod: user.paymentMethod,
      status: Const.orderStatus.PAYMENT_PENDING,
      expirationDate,
      price: originalPrice,
      shipping: {
        origin:
          receiver.shippingAddresses.find((address) => address.isDefault) ||
          receiver.shippingAddresses[0],
        destination:
          sender.shippingAddresses.find((address) => address.isDefault) ||
          sender.shippingAddresses[0],
      },
      events: [],
    });

    await Auction.updateOne({ _id: auction._id.toString() }, { orderId: order._id.toString() });

    const localAmountReceiver = { ...bid };
    delete localAmountReceiver.valueInSats;
    const { localAmountSender, amountInUsd } = await getConvertedAmounts({ originalPrice, sender });

    await sendNotifications({ order: order.toObject(), sender, receiver, localAmountSender });

    if (user.paymentMethod === Const.auctionPaymentMethodType.TRANSFER) {
      return;
    }

    const {
      paymentMethodType,
      paymentMethodName,
      paymentUrl,
      paymentMethodId,
      creditCardName,
      creditCardLastDigits,
    } = await getPaymentData({ sender, auctionPaymentMethod: user.paymentMethod });

    const transfer = await Transfer.create({
      senderType: "user",
      senderId: sender._id.toString(),
      senderPhoneNumber: sender.phoneNumber,
      senderCountryCode: sender.countryCode,
      receiverId: receiver._id.toString(),
      receiverPhoneNumber: receiver.phoneNumber,
      receiverCountryCode: receiver.countryCode,
      transferType: Const.transferTypeOrder,
      productName: auction.product.name,
      paymentMethodType,
      paymentMethodName,
      amount: amountInUsd,
      originalPrice,
      receiptEmail: sender.email,
      message: "",
      status: Const.transferPrepayment,
      source: "flom_v1",
      eligibleForPayout: true,
      satsAmount: bid.valueInSats,
      localAmountSender,
      localAmountReceiver,
      productId: auction.product._id,
      auctionId: auction._id.toString(),
    });

    await Order.updateOne(
      { _id: order._id.toString() },
      { transferId: transfer._id.toString(), modified: Date.now() },
    );

    await Utils.sendRequest({
      method: "POST",
      url: paymentUrl,
      headers: {
        "access-token": sender.token[0].token,
        "device-type": sender.deviceType || "unknown",
      },
      body: {
        source: "flom_v1",
        transferId: transfer._id.toString(),
        paymentMethodId,
        creditCardName,
        creditCardLastDigits,
      },
    });

    return order;
  } catch (error) {
    logger.error("handlePayment error:", error);
    return false;
  }
}

async function getConvertedAmounts({ originalPrice, sender }) {
  if (!conversionRates.rates || Date.now() - conversionRates.lastUpdated > 1000 * 60 * 30) {
    const rateObj = await Utils.getConversionRates();
    conversionRates.rates = rateObj.rates;
    conversionRates.lastUpdated = Date.now();
  }

  const amountInUsd = Utils.roundNumber(
    originalPrice.value / conversionRates.rates[originalPrice.currency],
    2,
  );

  const senderCurrency = Utils.getCurrencyFromCountryCode({
    countryCode: sender.countryCode,
    rates: conversionRates.rates,
  });

  const localValue = amountInUsd * conversionRates.rates[senderCurrency];

  const localAmountSender = {
    countryCode: sender.countryCode,
    currency: senderCurrency,
    value: Utils.roundNumber(localValue, 2),
  };

  return { localAmountSender, amountInUsd };
}

async function getPaymentData({ sender, auctionPaymentMethod }) {
  let paymentMethodType;
  let paymentMethodName;
  let paymentUrl;

  switch (auctionPaymentMethod) {
    case Const.auctionPaymentMethodType.GLOBAL_BALANCE:
      paymentMethodType = Const.paymentMethodTypeSatsBalance;
      paymentMethodName = "Global balance";
      paymentUrl = Config.paymentServiceBaseUrl + "/api/v2/payment/sats";
      break;
    case Const.auctionPaymentMethodType.CREDIT_CARD:
      paymentMethodType = Const.paymentMethodTypeCreditCard;
      paymentMethodName = "Credit card";
      paymentUrl = Config.paymentServiceBaseUrl + "/api/v2/transfers/v2";
      break;
    default:
      throw new Error(
        "getPaymentData, invalid auctionPaymentMethod for user: " + sender._id.toString(),
      );
  }

  let paymentMethodId, creditCardName, creditCardLastDigits;
  if (auctionPaymentMethod === Const.auctionPaymentMethodType.CREDIT_CARD) {
    const methods = await authorizeNet.getSavedPaymentMethods(sender.paymentProfileId);

    const formatted = methods
      .map((element) => {
        let creditCardName = element.payment.creditCard.cardType;
        if (creditCardName !== "MasterCard" && creditCardName !== "JCB") {
          creditCardName = creditCardName.replace(/([A-Z])/g, " $1").trim();
        }

        const creditCardNumber = element.payment.creditCard.cardNumber.replace("XXXX", "");

        const tempExpirationDate = element.payment.creditCard.expirationDate;
        const currentDate = new Date().toJSON().slice(0, 7);
        let expired = false;
        if (Date.parse(currentDate) > Date.parse(tempExpirationDate)) {
          expired = true;
        }

        return {
          paymentMethodId: element.customerPaymentProfileId,
          creditCardName,
          creditCardNumber,
          expired,
        };
      })
      .filter((method) => !method.expired);

    if (formatted.length === 0) {
      throw new Error("No valid payment methods found for user: " + sender._id.toString());
    }

    const method = formatted[0];

    paymentMethodId = method.paymentMethodId;
    creditCardName = method.creditCardName;
    creditCardLastDigits = method.creditCardNumber;
  }

  return {
    paymentMethodType,
    paymentMethodName,
    paymentUrl,
    paymentMethodId,
    creditCardName,
    creditCardLastDigits,
  };
}

async function sendNotifications({ order, sender, receiver, localAmountSender }) {
  await Utils.sendFlomPush({
    senderId: Config.flomSupportUserId,
    receiverUser: sender,
    message: `You have won an auction, and an order has been prepared.`,
    messageiOs: `You have won an auction, and an order has been prepared.`,
    pushType: Const.pushTypeAuctionWin,
    isMuted: false,
    orderId: order._id.toString(),
  });
  await Utils.sendFlomPush({
    senderId: Config.flomSupportUserId,
    receiverUser: receiver,
    message: `You have sold an auction, and an order has been prepared.`,
    messageiOs: `You have sold an auction, and an order has been prepared.`,
    pushType: Const.pushTypeAuctionWin,
    isMuted: false,
    orderId: order._id.toString(),
  });

  if (sender.email) {
    const shippingDestination = !order.shipping.destination
      ? ""
      : `${order.shipping.destination.name}
    ${order.shipping.destination.road} ${order.shipping.destination.houseNumber}
    ${order.shipping.destination.city}, ${order.shipping.destination.region} ${order.shipping.destination.postcode}
    ${order.shipping.destination.country}`;

    await Utils.sendEmailFromTemplate({
      templatePath: "src/email-templates/orderEmail.html",
      to: sender.email,
      subject: "New order: " + order._id.toString(),
      templateDataInput: {
        orderId: order._id.toString(),
        auctionId: order.auctionId,
        value: localAmountSender.value,
        currency: localAmountSender.currency,
        productName:
          order.products.length === 1
            ? order.products[0].name
            : `${order.products[0].name} + ${order.products.length - 1} more`,
        shippingDestination,
      },
    });
  }
}

module.exports = { checkToken, handlePayment };
