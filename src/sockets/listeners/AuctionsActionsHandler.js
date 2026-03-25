"use strict";

const { logger, redis } = require("#infra");
const { Const } = require("#config");
const Utils = require("#utils");
const { User, Auction, LiveStream, Product, SatsReservation } = require("#models");
const socketApi = require("../socket-api");

const helpers = require("./helpers/auctionHelpers");

let conversionRates = { rates: null, lastUpdated: 0 };

module.exports = function (socket) {
  /**
   * @api {socket} "connection"
   * @apiName connection
   * @apiGroup Socket
   * @apiDescription connection
   * @apiParam {string} token
   * @apiParam {string} processId
   * @apiParam {string} UUID
   *
   */

  socket.on("connection", async function (params, callback) {
    logger.info("auctions connection called, params:", params);

    if (typeof callback === "function") callback(value);

    return;
  });

  /**
   * @api {socket} "startAuction"
   * @apiName Start Auction
   * @apiGroup Socket
   * @apiDescription Start Auction
   * @apiParam {string} liveStreamId
   * @apiParam {string} auctionId
   * @apiParam {string} token
   *
   */

  socket.on("startAuction", async function (params, callback) {
    try {
      logger.info("startAuction called, params:", params);

      const { liveStreamId, auctionId, token } = params;

      if (!token) {
        logger.error("startAuction, token missing - " + Const.resCodeAuctionInvalidToken);
        return socket.emit("socketerror", { code: Const.resCodeAuctionInvalidToken });
      }

      const userId = await helpers.checkToken(token, socket);

      if (!userId) {
        logger.error(
          "startAuction, user with token not found - " + Const.resCodeAuctionInvalidToken,
        );
        return socket.emit("socketerror", { code: Const.resCodeAuctionInvalidToken });
      }

      if (!liveStreamId) {
        logger.error(
          "startAuction, liveStreamId error - " + Const.resCodeAuctionInvalidLiveStreamId,
        );
        return socket.emit("socketerror", { code: Const.resCodeAuctionInvalidLiveStreamId });
      }

      if (!auctionId) {
        logger.error("startAuction, auctionId error - " + Const.resCodeAuctionInvalidAuctionId);
        return socket.emit("socketerror", { code: Const.resCodeAuctionInvalidAuctionId });
      }

      const liveStream = await LiveStream.findById(liveStreamId).lean();
      if (!liveStream) {
        logger.error(
          "startAuction, livestream not found error - " + Const.resCodeAuctionLiveStreamNotFound,
        );
        return socket.emit("socketerror", { code: Const.resCodeAuctionLiveStreamNotFound });
      }

      const auction = await Auction.findById(auctionId).lean();
      if (!auction) {
        logger.error(
          "startAuction, auction not found error - " + Const.resCodeAuctionAuctionNotFound,
        );
        return socket.emit("socketerror", { code: Const.resCodeAuctionAuctionNotFound });
      }

      const start = Date.now();
      const end = start + auction.duration * 1000;

      const updatedAuction = await Auction.findByIdAndUpdate(
        auctionId,
        {
          startTimeStamp: start,
          endTimeStamp: end,
          isActive: true,
          status: Const.auctionStatus.ACTIVE,
        },
        { new: true, lean: true },
      );

      const dataToSend = {
        liveStreamId: liveStream._id.toString(),
        auctionId,
        auctionData: updatedAuction,
        serverTimeMs: Date.now(),
      };

      socketApi.auctions.emitAll("auctionStarted", dataToSend);

      if (typeof callback === "function") callback(updatedAuction);
    } catch (error) {
      logger.error("startAuction, ", error);
      return socket.emit("socketerror", { code: Const.responsecodeUnknownError });
    }
  });

  /**
   * @api {socket} "endAuction"
   * @apiName End Auction
   * @apiGroup Socket
   * @apiDescription End Auction
   * @apiParam {string} liveStreamId
   * @apiParam {string} auctionId
   * @apiParam {string} token
   *
   */

  socket.on("endAuction", async function (params, callback) {
    try {
      logger.info("endAuction called, params:", params);

      const { liveStreamId, auctionId, token, isLastItem = false } = params;

      if (!token) {
        logger.error("endAuction, token missing - " + Const.resCodeAuctionInvalidToken);
        return socket.emit("socketerror", { code: Const.resCodeAuctionInvalidToken });
      }

      const userId = await helpers.checkToken(token, socket);

      if (!userId) {
        logger.error("endAuction, user with token not found - " + Const.resCodeAuctionInvalidToken);
        return socket.emit("socketerror", { code: Const.resCodeAuctionInvalidToken });
      }

      if (!liveStreamId) {
        logger.error("endAuction, liveStreamId error - " + Const.resCodeAuctionInvalidLiveStreamId);
        return socket.emit("socketerror", { code: Const.resCodeAuctionInvalidLiveStreamId });
      }

      if (!auctionId) {
        logger.error("endAuction, auctionId error - " + Const.resCodeAuctionInvalidAuctionId);
        return socket.emit("socketerror", { code: Const.resCodeAuctionInvalidAuctionId });
      }

      const liveStream = await LiveStream.findById(liveStreamId).lean();
      if (!liveStream) {
        logger.error(
          "endAuction, livestream not found error - " + Const.resCodeAuctionLiveStreamNotFound,
        );
        return socket.emit("socketerror", { code: Const.resCodeAuctionLiveStreamNotFound });
      }

      const auction = await Auction.findById(auctionId).lean();
      if (!auction) {
        logger.error(
          "endAuction, auction not found error - " + Const.resCodeAuctionAuctionNotFound,
        );
        return socket.emit("socketerror", { code: Const.resCodeAuctionAuctionNotFound });
      }

      const winningBid = auction.bids.sort(
        (a, b) => b.bid.value - a.bid.value || a.timeStamp - b.timeStamp,
      )[0];

      const updatedAuction = await Auction.findByIdAndUpdate(
        auctionId,
        {
          winningBid: !winningBid
            ? null
            : {
                user: winningBid.user,
                timeStamp: winningBid.timeStamp,
                bid: winningBid.bid,
              },
          isActive: false,
          status: Const.auctionStatus.FINISHED,
        },
        { new: true, lean: true },
      );
      updatedAuction.bidCount = updatedAuction.bids.length;

      const uniqueBidders =
        auction.bids.length === 0 ? [] : Array.from(new Set(auction.bids.map((b) => b.user._id)));

      if (uniqueBidders.length > 0) {
        logger.info("endAuction, uniqueBidders:", uniqueBidders);

        await User.updateMany(
          { _id: { $in: uniqueBidders.filter((id) => id !== userId) } },
          { $set: { auctionPaymentMethodLocked: false } },
        );

        /*
        await SatsReservation.deleteMany({
          reservationType: "auctionBid",
          referenceId: auctionId,
          userId: { $in: uniqueBidders.filter((id) => id !== userId) },
        });
        */
      }

      const dataToSend = {
        liveStreamId: liveStream._id.toString(),
        auctionId,
        auctionData: updatedAuction,
        isLastItem: typeof isLastItem === "boolean" ? isLastItem : false,
        serverTimeMs: Date.now(),
      };

      socketApi.auctions.emitAll("auctionEnded", dataToSend);

      if (typeof callback === "function") callback(updatedAuction);

      if (winningBid) {
        helpers.handlePayment({ auction: updatedAuction });
      }
    } catch (error) {
      logger.error("endAuction, ", error);
      return socket.emit("socketerror", { code: Const.responsecodeUnknownError });
    }
  });

  /**
   * @api {socket} "bidOnAuction"
   * @apiName Bid On Auction
   * @apiGroup Socket
   * @apiDescription Bid On Auction
   * @apiParam {string} liveStreamId
   * @apiParam {string} auctionId
   * @apiParam {string} token
   * @apiParam {object} bidData
   * @apiParam {string} bidData.userId
   * @apiParam {number} bidData.bid
   *
   */

  socket.on("bidOnAuction", async function (params, callback) {
    try {
      logger.info("bidOnAuction called, params:", params);

      const { liveStreamId, auctionId, bidData, token } = params;

      if (!token) {
        logger.error("bidOnAuction, token missing - " + Const.resCodeAuctionInvalidToken);
        return socket.emit("socketerror", { code: Const.resCodeAuctionInvalidToken });
      }

      const user = await User.findOne({ "token.token": token }).lean();

      if (!user) {
        logger.error(
          "bidOnAuction, user with token not found - " + Const.resCodeAuctionInvalidToken,
        );
        return socket.emit("socketerror", { code: Const.resCodeAuctionInvalidToken });
      }
      if (!user.shippingAddresses || user.shippingAddresses.length === 0) {
        logger.error(
          "bidOnAuction, user has no shipping address - " + Const.resCodeAuctionNoShippingAddress,
        );
        return socket.emit("socketerror", { code: Const.resCodeAuctionNoShippingAddress });
      }

      const userId = user._id.toString();

      if (!liveStreamId) {
        logger.error(
          "bidOnAuction, liveStreamId error - " + Const.resCodeAuctionInvalidLiveStreamId,
        );
        return socket.emit("socketerror", { code: Const.resCodeAuctionInvalidLiveStreamId });
      }

      if (!auctionId) {
        logger.error("bidOnAuction, auctionId error - " + Const.resCodeAuctionInvalidAuctionId);
        return socket.emit("socketerror", { code: Const.resCodeAuctionInvalidAuctionId });
      }

      if (!bidData || !bidData.userId || !bidData.bid) {
        logger.error("bidOnAuction, bidData error - " + Const.resCodeAuctionInvalidBidData);
        return socket.emit("socketerror", { code: Const.resCodeAuctionInvalidBidData });
      }

      const liveStream = await LiveStream.findById(liveStreamId).lean();
      if (!liveStream) {
        logger.error(
          "bidOnAuction, livestream not found error - " + Const.resCodeAuctionLiveStreamNotFound,
        );
        return socket.emit("socketerror", { code: Const.resCodeAuctionLiveStreamNotFound });
      }

      const auction = await Auction.findById(auctionId).lean();
      if (!auction) {
        logger.error(
          "bidOnAuction, auction not found error - " + Const.resCodeAuctionAuctionNotFound,
        );
        return socket.emit("socketerror", { code: Const.resCodeAuctionAuctionNotFound });
      }

      const biggestBid = !auction.bids.length
        ? null
        : auction.bids.sort((a, b) => b.bid.value - a.bid.value || a.timeStamp - b.timeStamp)[0];
      if (
        (biggestBid && bidData.bid <= biggestBid.bid.value) ||
        (!biggestBid && bidData.bid < auction.minPrice.value)
      ) {
        logger.error("bidOnAuction, bid value too low - " + Const.responsecodePriceTooLow);
        return socket.emit("socketerror", { code: Const.responsecodePriceTooLow });
      }

      if (user.bannedFromAuctionsUntil && user.bannedFromAuctionsUntil > Date.now()) {
        logger.error(
          "bidOnAuction, user banned from auctions - " + Const.resCodeAuctionUserBannedFromAuctions,
        );
        return socket.emit("socketerror", { code: Const.resCodeAuctionUserBannedFromAuctions });
      }

      if (!user.auctionPaymentMethod) {
        logger.error(
          "bidOnAuction, user has no auction payment method - " +
            Const.resCodeAuctionUserHasNoAuctionPaymentMethod,
        );
        return socket.emit("socketerror", {
          code: Const.resCodeAuctionUserHasNoAuctionPaymentMethod,
        });
      }

      const isFirstBidByUser = !auction.bids.some((b) => b.user._id === userId);
      if (isFirstBidByUser) {
        await User.findByIdAndUpdate(userId, { auctionPaymentMethodLocked: true });
      }

      if (!conversionRates.rates || Date.now() - conversionRates.lastUpdated > 1000 * 60 * 30) {
        const rateObj = await Utils.getConversionRates();
        conversionRates.rates = rateObj.rates;
        conversionRates.lastUpdated = Date.now();
      }

      const valueInSats =
        (bidData.bid / conversionRates.rates[auction.minPrice.currency]) *
        conversionRates.rates.SAT;

      bidData.bid = {
        countryCode: auction.minPrice.countryCode,
        currency: auction.minPrice.currency,
        value: bidData.bid,
        valueInSats: Math.ceil(valueInSats),
      };

      if (
        user.auctionPaymentMethod === Const.auctionPaymentMethodType.GLOBAL_BALANCE &&
        user.satsBalance < valueInSats
      ) {
        logger.error(
          "bidOnAuction, user has not enough global balance - " +
            Const.resCodeAuctionGlobalBalanceTooLow,
        );
        return socket.emit("socketerror", { code: Const.resCodeAuctionGlobalBalanceTooLow });
      } else if (
        user.auctionPaymentMethod === Const.auctionPaymentMethodType.TRANSFER &&
        user.satsBalance < Const.restockingFee
      ) {
        logger.error(
          "bidOnAuction, user has not enough global balance - restocking fee" +
            Const.resCodeAuctionGlobaBalanceTooLowRestockingFee,
        );
        return socket.emit("socketerror", {
          code: Const.resCodeAuctionGlobaBalanceTooLowRestockingFee,
        });
      }

      bidData.timeStamp = Date.now();
      bidData.user = {
        _id: user._id.toString(),
        phoneNumber: user.phoneNumber,
        userName: user.userName,
        created: user.created,
        avatar: user.avatar,
        paymentMethod: user.auctionPaymentMethod,
      };
      delete bidData.userId;
      const updateObj = { $push: { bids: bidData } };

      const time = bidData.timeStamp;
      const end = auction.endTimeStamp;

      let eventName = "auctionBiddedOn";

      if (time >= end) {
        logger.error("bidOnAuction, auction ended error - " + Const.resCodeAuctionAuctionEnded);
        return socket.emit("socketerror", { code: Const.resCodeAuctionAuctionEnded });
      }

      if (!auction.isSuddenDeath && end - time < auction.softCloseWindow * 1000) {
        const newEnd = time + auction.counterBidTime * 1000;

        if (newEnd > end) {
          updateObj.$set = { endTimeStamp: newEnd };
          eventName = "auctionExtended";
        }
      }

      const updatedAuction = await Auction.findByIdAndUpdate(auctionId, updateObj, {
        new: true,
        lean: true,
      });

      if (user.auctionPaymentMethod === Const.auctionPaymentMethodType.GLOBAL_BALANCE) {
        await SatsReservation.findOneAndUpdate(
          { userId, reservationType: "auctionBid", referenceId: auctionId },
          { value: valueInSats },
          { upsert: true },
        );
      } else if (user.auctionPaymentMethod === Const.auctionPaymentMethodType.TRANSFER) {
        await SatsReservation.findOneAndUpdate(
          { userId, reservationType: "auctionBid", referenceId: auctionId },
          { value: Math.max(Const.restockingFee, valueInSats) },
          { upsert: true },
        );
      }

      updatedAuction.winningBid = updatedAuction.bids.sort(
        (a, b) => b.bid.value - a.bid.value || a.timeStamp - b.timeStamp,
      )[0];
      updatedAuction.bidCount = updatedAuction.bids.length;
      delete updatedAuction.bids;

      const dataToSend = {
        liveStreamId: liveStream._id.toString(),
        auctionId,
        auctionData: updatedAuction,
        serverTimeMs: Date.now(),
      };

      socketApi.auctions.emitAll(eventName, dataToSend);

      if (typeof callback === "function") callback(updatedAuction);
    } catch (error) {
      logger.error("bidOnAuction, ", error);
      return socket.emit("socketerror", { code: Const.responsecodeUnknownError });
    }
  });
};
