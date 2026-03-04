"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { Auction } = require("#models");

/**
 * @api {delete} /api/v2/auctions/:auctionId Delete auction flom_v1
 * @apiVersion 2.0.31
 * @apiName  Delete auction flom_v1
 * @apiGroup WebAPI Auction
 * @apiDescription  Delete auction.
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
 * @apiError (Errors) 4000007 Token invalid
 */

router.delete("/:auctionId", auth({ allowUser: true }), async function (request, response) {
  try {
    const { auctionId } = request.params;

    if (!auctionId || !Utils.isValidObjectId(auctionId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidAuctionId,
        message: `DeleteAuctionController, missing or invalid auctionId`,
      });
    }

    await Auction.deleteOne({ _id: auctionId, sellerId: request.user._id.toString() });

    const responseData = {};
    Base.successResponse(response, Const.responsecodeSucceed, responseData);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "DeleteAuctionController",
      error,
    });
  }
});

module.exports = router;
