"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { Auction, LiveStream, Order } = require("#models");

/**
 * @api {get} /api/v2/auctions/active-on-live-stream Get active auction on live stream flom_v1
 * @apiVersion 2.0.31
 * @apiName  Get active auction on live stream flom_v1
 * @apiGroup WebAPI Auction
 * @apiDescription  Get active auction on live stream.
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiParam (Query string) {String} liveStreamId  Id of live stream
 *
 * @apiSuccessExample {json} Success Response
 * {
 *     "code": 1,
 *     "time": 1764245263992,
 *     "data": {
 *        "activeAuction":
 *          {
 *            "minPrice": {
 *              "countryCode": "HR",
 *              "currency": "EUR",
 *              "value": 20
 *            },
 *            "isActive": false,
 *            "isSuddenDeath": false,
 *            "bids": [],
 *            "created": 1764245263886,
 *            "modified": 1764245263887,
 *            "_id": "69283f0f35c89a59b01993cb",
 *            "productId": "63dced5fc30542684f1b7b6e",
 *            "liveStreamId": "66f55c5223e0295a93ab8e52",
 *            "duration": 300,
 *            "bidIncrement": 1,
 *            "counterBidTime": 10,
 *            "softCloseWindow": 10,
 *            "quantity": 3,
 *            "__v": 0
 *          }
 *     }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 443863 Invalid live stream id
 * @apiError (Errors) 443855 Live stream not found
 * @apiError (Errors) 4000007 Token invalid
 */

router.get("/active-on-live-stream", auth({ allowUser: true }), async function (request, response) {
  try {
    const { liveStreamId } = request.query;

    if (!liveStreamId || !Utils.isValidObjectId(liveStreamId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidLiveStreamId,
        message: `GetAuctionController, Get active auction for live stream, missing or invalid livestream id`,
      });
    }

    const liveStream = await LiveStream.findById(liveStreamId).lean();
    if (!liveStream) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeLiveStreamNotFound,
        message: `GetAuctionController, Get active auction for live stream, live stream not found`,
      });
    }

    const activeAuction = await Auction.findOne({ liveStreamId, isActive: true }).lean();

    const responseData = { activeAuction };
    Base.successResponse(response, Const.responsecodeSucceed, responseData);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "GetAuctionController, Get active auction for live stream",
      error,
    });
  }
});

/**
 * @api {get} /api/v2/auctions/:auctionId Get auction flom_v1
 * @apiVersion 2.0.31
 * @apiName  Get auction flom_v1
 * @apiGroup WebAPI Auction
 * @apiDescription  Get auction.
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiSuccessExample {json} Success Response
 * {
 *     "code": 1,
 *     "time": 1764245263992,
 *     "data": {
 *        "auction":
 *          {
 *            "minPrice": {
 *              "countryCode": "HR",
 *              "currency": "EUR",
 *              "value": 20
 *            },
 *            "isActive": false,
 *            "isSuddenDeath": false,
 *            "bids": [],
 *            "created": 1764245263886,
 *            "modified": 1764245263887,
 *            "_id": "69283f0f35c89a59b01993cb",
 *            "productId": "63dced5fc30542684f1b7b6e",
 *            "liveStreamId": "66f55c5223e0295a93ab8e52",
 *            "duration": 300,
 *            "bidIncrement": 1,
 *            "counterBidTime": 10,
 *            "softCloseWindow": 10,
 *            "quantity": 3,
 *            "transferToken": "someTransferToken",
 *            "__v": 0
 *          }
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
 * @apiError (Errors) 4000007 Token invalid
 */

router.get("/:auctionId", auth({ allowUser: true }), async function (request, response) {
  try {
    const { auctionId } = request.params;

    if (!auctionId || !Utils.isValidObjectId(auctionId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidAuctionId,
        message: `GetAuctionController, Get auction, missing or invalid auctionId`,
      });
    }

    const auction = await Auction.findById(auctionId).lean();
    if (!auction) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeAuctionNotFound,
        message: `GetAuctionController, Get auction, auction not found`,
      });
    }

    const order = await Order.findOne({ auctionId: auction._id.toString() }).lean();
    if (order && order.transferToken) {
      auction.transferToken = order.transferToken;
    }

    const responseData = { auction };
    Base.successResponse(response, Const.responsecodeSucceed, responseData);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "GetAuctionController, Get auction",
      error,
    });
  }
});

module.exports = router;
