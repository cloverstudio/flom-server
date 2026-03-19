"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { Auction } = require("#models");
const { handlePayment } = require("../../../sockets/listeners/helpers/auctionHelpers");

/**
 * @api {patch} /api/v2/auctions/:auctionId/accept Accept second bidder auction offer flom_v1
 * @apiVersion 2.0.31
 * @apiName  Accept second bidder auction offer flom_v1
 * @apiGroup WebAPI Auction
 * @apiDescription  Accept second bidder auction offer.
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiSuccessExample {json} Success Response
 * {
 *     "code": 1,
 *     "time": 1764245263992,
 *     "data": {
 *       "order": OrderModel
 *     }
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
 * @apiError (Errors) 443939 Auction payment failed
 * @apiError (Errors) 4000007 Token invalid
 */

router.patch("/:auctionId/accept", auth({ allowUser: true }), async function (request, response) {
  try {
    const { auctionId } = request.params;

    if (!auctionId || !Utils.isValidObjectId(auctionId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidAuctionId,
        message: `AcceptAuctionOfferController, missing or invalid auctionId`,
      });
    }

    const auction = await Auction.findById(auctionId).lean();

    if (!auction) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeAuctionNotFound,
        message: `AcceptAuctionOfferController, auction not found for id ${auctionId}`,
      });
    }

    if (auction.winningBid.user._id !== request.user._id.toString()) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNotAllowed,
        message: `AcceptAuctionOfferController, user is not winning bidder for auction id ${auctionId}`,
      });
    }

    await Auction.findByIdAndUpdate(auctionId, {
      $set: { status: Const.auctionStatus.SOLD, modified: Date.now() },
    });

    const order = await handlePayment({ auction, isFromAccept: true });

    if (!order) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeAuctionPaymentFailed,
        message: `AcceptAuctionOfferController, auction payment failed`,
      });
    }

    logger.info(
      `AcceptAuctionOfferController, order created for auction id ${auctionId}, order id ${order._id.toString()}`,
    );

    const responseData = { order };
    Base.successResponse(response, Const.responsecodeSucceed, responseData);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "AcceptAuctionOfferController",
      error,
    });
  }
});

module.exports = router;
