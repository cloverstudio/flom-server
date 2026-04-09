"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { Auction, Product } = require("#models");
const { socketApi } = require("#sockets");

/**
 * @api {patch} /api/v2/auctions/:auctionId Update auction flom_v1
 * @apiVersion 2.0.31
 * @apiName  Update auction flom_v1
 * @apiGroup WebAPI Auction
 * @apiDescription  Update auction.
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiParam {Number}    [duration]         Duration of auction in seconds, whole numbers only (min 5, max 300, default 30)
 * @apiParam {Object}    [minPrice]         Starting price of the item. { countryCode: String ("US", "HR", "NG"), currency: String ("USD", "EUR", "NGN"), value: Number }
 * @apiParam {Number}    [quantity]         Quantity of product to be auctioned. If not sent, it is set to 1. Whole numbers only.
 * @apiParam {Number}    [bidIncrement]     Amount by which every bid is raised, whole numbers only, default = 1
 * @apiParam {Number}    [counterBidTime]   Time by which to extend auction in seconds - allowed values are 5, 7, 10 seconds. Default: 10
 * @apiParam {Boolean}   [isSuddenDeath]    If true, counter bid time is disabled. Default: false
 * @apiParam {Number}    [note]             Note for the auction
 *
 * @apiSuccessExample {json} Success Response
 * {
 *     "code": 1,
 *     "time": 1764245263992,
 *     "data": {
 *         "updatedAuction": {
 *              "minPrice": {
 *                  "countryCode": "HR",
 *                  "currency": "EUR",
 *                  "value": 20
 *              },
 *              "isActive": false,
 *              "isSuddenDeath": false,
 *              "bids": [],
 *              "created": 1764245263886,
 *              "modified": 1764245263887,
 *              "_id": "69283f0f35c89a59b01993cb",
 *              "productId": "63dced5fc30542684f1b7b6e",
 *              "liveStreamId": "66f55c5223e0295a93ab8e52",
 *              "duration": 300,
 *              "bidIncrement": 1,
 *              "counterBidTime": 10,
 *              "softCloseWindow": 30,
 *              "quantity": 3,
 *              "note": "This is a sample auction note",
 *              "__v": 0
 *         }
 *     }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443858 User not allowed: streamer is not request user
 * @apiError (Errors) 443930 Invalid duration
 * @apiError (Errors) 443931 Invalid quantity
 * @apiError (Errors) 443932 Invalid bid increment
 * @apiError (Errors) 443933 Invalid min price
 * @apiError (Errors) 443934 Invalid counter bid time
 * @apiError (Errors) 443936 Invalid soft close window
 * @apiError (Errors) 4000007 Token invalid
 */

router.patch("/:auctionId", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const { auctionId } = request.params;

    if (!auctionId || !Utils.isValidObjectId(auctionId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidAuctionId,
        message: `UpdateAuctionController, Update auction, missing or invalid auctionId`,
      });
    }

    const auction = await Auction.findById(auctionId).lean();
    if (!auction) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeAuctionNotFound,
        message: `UpdateAuctionController, Update auction, auction not found`,
      });
    }

    if (auction.sellerId !== user._id.toString()) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNotAllowed,
        message: `UpdateAuctionController, Update auction, user not allowed to update this auction`,
      });
    }

    const {
      paramsErrorCode = null,
      paramsErrorMsg = null,
      ...updateObj
    } = await checkParams(request.body, auction);

    if (paramsErrorCode) {
      return Base.newErrorResponse({
        response,
        code: paramsErrorCode,
        message: `UpdateAuctionController, Update auction, ${paramsErrorMsg}`,
      });
    }

    const updatedAuction = await Auction.findByIdAndUpdate(auctionId, updateObj, {
      new: true,
    }).lean();

    const responseData = { updatedAuction };
    Base.successResponse(response, Const.responsecodeSucceed, responseData);

    socketApi.emitAll(
      "auctionUpdated",
      {
        auctionId: updatedAuction._id.toString(),
        liveStreamId: updatedAuction.liveStreamId,
        auctionData: updatedAuction,
      },
      "auctions",
    );
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "UpdateAuctionController, Update auction",
      error,
    });
  }
});

async function checkParams(
  {
    duration = undefined,
    quantity = undefined,
    bidIncrement = undefined,
    counterBidTime = undefined,
    minPrice = undefined,
    note = undefined,
    isSuddenDeath = undefined,
  },
  auction,
) {
  const updateObj = {};

  if (duration) {
    if (
      typeof duration !== "number" ||
      duration.toString().includes(".") ||
      duration < 5 ||
      duration > 300
    ) {
      return {
        paramsErrorCode: Const.responsecodeInvalidDuration,
        paramsErrorMsg: "invalid duration: " + duration,
      };
    }

    updateObj.duration = duration;
  }

  if (counterBidTime) {
    if (
      typeof counterBidTime !== "number" ||
      counterBidTime.toString().includes(".") ||
      ![5, 7, 10].includes(counterBidTime)
    ) {
      return {
        paramsErrorCode: Const.responsecodeInvalidCounterBidTime,
        paramsErrorMsg: "invalid counterBidTime",
      };
    }

    updateObj.counterBidTime = counterBidTime;
  }

  if (quantity) {
    const product = await Product.findById(auction.productId).lean();

    if (
      typeof quantity !== "number" ||
      quantity.toString().includes(".") ||
      quantity > product.itemCount
    ) {
      return {
        paramsErrorCode: Const.responsecodeInvalidQuantity,
        paramsErrorMsg: "quantity higher than item count in product",
      };
    }

    updateObj.quantity = quantity;
  }

  if (bidIncrement) {
    if (typeof bidIncrement !== "number" || bidIncrement.toString().includes(".")) {
      return {
        paramsErrorCode: Const.responsecodeInvalidBidIncrement,
        paramsErrorMsg: "invalid bid increment: " + bidIncrement,
      };
    }

    updateObj.bidIncrement = bidIncrement;
  }

  if (minPrice) {
    if (!minPrice.value || !minPrice.countryCode || !minPrice.currency) {
      return {
        paramsErrorCode: Const.responsecodeInvalidMinPrice,
        paramsErrorMsg: "invalid min price",
      };
    }

    const conversionRates = await Utils.getConversionRates();
    const valueInSats =
      (minPrice.value / conversionRates.rates[minPrice.currency]) * conversionRates.rates.SAT;
    minPrice.valueInSats = Math.ceil(valueInSats);
    updateObj.minPrice = minPrice;
  }

  if (note) {
    if (typeof note !== "string") {
      return {
        paramsErrorCode: Const.responsecodeInvalidNote,
        paramsErrorMsg: "invalid note",
      };
    }

    updateObj.note = note;
  }

  if (isSuddenDeath !== undefined && typeof isSuddenDeath === "boolean") {
    updateObj.isSuddenDeath = isSuddenDeath;
  }

  return updateObj;
}

module.exports = router;
