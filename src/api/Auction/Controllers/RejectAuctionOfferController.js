"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { Auction, Order, User, Transfer } = require("#models");

/**
 * @api {patch} /api/v2/auctions/:auctionId/reject Reject second bidder auction offer flom_v1
 * @apiVersion 2.0.31
 * @apiName  Reject second bidder auction offer flom_v1
 * @apiGroup WebAPI Auction
 * @apiDescription  Reject second bidder auction offer.
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiSuccessExample {json} Success Response
 * {
 *     "code": 1,
 *     "time": 1764245263992,
 *     "data": {}
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 443937 Invalid auction id
 * @apiError (Errors) 443938 Auction not found
 * @apiError (Errors) 443858 User not allowed (not winning bidder)
 * @apiError (Errors) 4000007 Token invalid
 */

router.delete("/:auctionId/reject", auth({ allowUser: true }), async function (request, response) {
  try {
    const { auctionId } = request.params;

    if (!auctionId || !Utils.isValidObjectId(auctionId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidAuctionId,
        message: `RejectAuctionOfferController, missing or invalid auctionId`,
      });
    }

    const auction = await Auction.findById(auctionId).lean();

    if (!auction) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeAuctionNotFound,
        message: `RejectAuctionOfferController, auction not found for id ${auctionId}`,
      });
    }

    if (auction.winningBid.user._id !== request.user._id.toString()) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNotAllowed,
        message: `RejectAuctionOfferController, user is not winning bidder for auction id ${auctionId}`,
      });
    }

    const order = await Order.findOne({ auctionId }).lean();

    if (order) {
      const restockingFee = Const.restockingFee;
      const flomAgent = await User.findById(process.env.FLOM_AGENT_ID).lean();
      const receiver = await User.findById(order.seller._id).lean();

      const receiverFee = Math.ceil(0.7 * restockingFee);

      const { rates = null } = await Utils.getConversionRates();

      if (!rates) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeUnknownError,
          message: `RejectAuctionOfferController, failed to get conversion rates`,
        });
      }

      const agentCurrency = flomAgent.currency || "USD";
      const receiverCurrency =
        receiver.currency ||
        Utils.getCurrencyFromCountryCode({ countryCode: receiver.countryCode, rates: rates }) ||
        "USD";

      const localAmountSender = {
        countryCode: agentCurrency === "USD" ? "US" : flomAgent.countryCode,
        currency: agentCurrency,
        value: Utils.roundNumber((receiverFee / rates["SAT"]) * rates[agentCurrency], 2),
      };
      const localAmountReceiver = {
        countryCode: receiver.countryCode,
        currency: receiverCurrency,
        value: Utils.roundNumber((receiverFee / rates["SAT"]) * rates[receiverCurrency], 2),
      };

      await Transfer.create({
        senderType: "user",
        senderId: flomAgent._id.toString(),
        senderPhoneNumber: flomAgent.phoneNumber,
        receiverId: receiver._id.toString(),
        receiverPhoneNumber: receiver.phoneNumber,
        transferType: Const.transferTypeRestockingFee,
        paymentMethodType: Const.paymentMethodTypeSatsBalance,
        originalPrice: { countryCode: "SAT", currency: "SAT", value: receiverFee },
        satsAmount: receiverFee,
        localAmountSender,
        localAmountReceiver,
        message: "",
        status: Const.transferComplete,
        source: "flom_v1",
        orderId: order._id.toString(),
      });

      await User.updateOne({ _id: receiver._id }, { $inc: { satsBalance: receiverFee } });

      await User.updateOne({ _id: flomAgent._id }, { $inc: { satsBalance: -receiverFee } });
    }

    await Auction.findByIdAndUpdate(auctionId, {
      $set: { status: Const.auctionStatus.UNSOLD, modified: Date.now() },
    });

    return Base.successResponse(response, Const.responsecodeSucceed);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "RejectAuctionOfferController",
      error,
    });
  }
});

module.exports = router;
