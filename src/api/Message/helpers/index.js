"use strict";

const { logger } = require("#infra");
const { Const } = require("#config");
const Utils = require("#utils");
const { Product, User } = require("#models");

const createOfferMessage = async ({ user: buyer, productId, offer, quantity }) => {
  const message = { type: Const.messageTypeOffer, message: "", attributes: {} };

  const buyerCountryCode =
    offer.countryCode ||
    buyer.countryCode ||
    Utils.getCountryCodeFromPhoneNumber({ phoneNumber: buyer.phoneNumber });
  const product = await Product.findById(productId).lean();
  const { _id, ownerId, created, description, name, originalPrice, file } = product;

  const seller = await User.findById(ownerId).lean();

  const roomId =
    seller.created < buyer.created
      ? `1-${seller._id.toString()}-${buyer._id.toString()}`
      : `1-${buyer._id.toString()}-${seller._id.toString()}`;
  message.roomID = roomId;

  const imageObj = { ...file[0] };
  imageObj._id = imageObj._id.toString();
  imageObj.file.size = imageObj.file.size.toString();
  imageObj.thumb.size = imageObj.thumb.size.toString();

  const conversionRates = await Utils.getConversionRates();
  const buyerCurrency =
    offer.currency ||
    Utils.getCurrencyFromCountryCode({
      countryCode: buyerCountryCode,
      rates: conversionRates.rates,
    });
  const buyerRate = conversionRates.rates[buyerCurrency];

  const buyerOffer = offer;

  const productRate = conversionRates.rates[originalPrice.currency];

  const userPrice = {
    countryCode: buyerCountryCode,
    currency: buyerCurrency,
    value:
      originalPrice.value !== -1
        ? Utils.roundNumber(originalPrice.value * (buyerRate / productRate), 2)
        : -1,
    minValue:
      originalPrice.minValue !== -1
        ? Utils.roundNumber(originalPrice.minValue * (buyerRate / productRate), 2)
        : -1,
    maxValue:
      originalPrice.maxValue !== -1
        ? Utils.roundNumber(originalPrice.maxValue * (buyerRate / productRate), 2)
        : -1,
  };

  message.attributes.product = {
    _id: _id.toString(),
    created,
    description,
    name,
    originalPrice,
    userPrice,
    buyerOffer,
    quantity,
    productOwnerPhoneNumber: seller.phoneNumber,
    file: [imageObj],
  };

  return message;
};

module.exports = { createOfferMessage };
