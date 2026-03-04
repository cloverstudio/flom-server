"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { Auction, User, LiveStream, Product, Tribe } = require("#models");
const { socketApi } = require("#sockets");

/**
 * @api {post} /api/v2/auctions Create auctions flom_v1
 * @apiVersion 2.0.31
 * @apiName  Create auctions flom_v1
 * @apiGroup WebAPI Auction
 * @apiDescription  Create auctions.
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiParam {String}    liveStreamId                Id of live stream
 * @apiParam {Object[]}  auctions                    Array of auctions to be created
 * @apiParam {String}    auctions.productId          Id of product being sold on live stream
 * @apiParam {Number}    auctions.duration           Duration of auction in seconds, whole numbers only (min 5, max 300, default 30)
 * @apiParam {Object}    auctions.minPrice           Starting price of the item. { countryCode: String ("US", "HR", "NG"), currency: String ("USD", "EUR", "NGN"), value: Number }
 * @apiParam {Number}    auctions.[quantity]         Quantity of product to be auctioned. If not sent, it is set to 1. Whole numbers only.
 * @apiParam {Number}    auctions.bidIncrement       Amount by which every bid is raised, whole numbers only, default = 1
 * @apiParam {Number}    auctions.counterBidTime     Time by which to extend auction in seconds - allowed values are 5, 7, 10 seconds. Default: 10
 * @apiParam {Boolean}   auctions.isSuddenDeath      If true, counter bid time is disabled. Default: false
 * @apiParam {Number}    auctions.[note]             Note for the auction
 *
 * @apiSuccessExample {json} Success Response
 * {
 *     "code": 1,
 *     "time": 1764245263992,
 *     "data": {
 *        "auctions": [
 *           {
 *             "minPrice": {
 *                 "countryCode": "HR",
 *                 "currency": "EUR",
 *                 "value": 20
 *             },
 *             "isActive": false,
 *             "isSuddenDeath": false,
 *             "bids": [],
 *             "created": 1764245263886,
 *             "modified": 1764245263887,
 *             "_id": "69283f0f35c89a59b01993cb",
 *             "productId": "63dced5fc30542684f1b7b6e",
 *             "liveStreamId": "66f55c5223e0295a93ab8e52",
 *             "duration": 300,
 *             "bidIncrement": 1,
 *             "counterBidTime": 10,
 *             "softCloseWindow": 30,
 *             "quantity": 3,
 *             "note": "This is a sample auction note",
 *             "__v": 0
 *           }
 *        ]
 *     }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 400310 Missing product id
 * @apiError (Errors) 400160 Product not found
 * @apiError (Errors) 400470 Product owner is not request user
 * @apiError (Errors) 443863 Invalid live stream id
 * @apiError (Errors) 443855 Live stream not found
 * @apiError (Errors) 443858 User not allowed: streamer is not request user
 * @apiError (Errors) 400163 Product id not in stream's linked product ids
 * @apiError (Errors) 443930 Invalid duration
 * @apiError (Errors) 443931 Invalid quantity
 * @apiError (Errors) 443932 Invalid bid increment
 * @apiError (Errors) 443933 Invalid min price
 * @apiError (Errors) 443934 Invalid counter bid time
 * @apiError (Errors) 443936 User has no shipping address
 * @apiError (Errors) 443935 Invalid note
 * @apiError (Errors) 4000007 Token invalid
 */

router.post("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const { auctions = null, liveStreamId } = request.body;

    if (!user.shippingAddresses || user.shippingAddresses.length === 0) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoShippingAddress,
        message: `CreateAuctionController, Create auction, user has no shipping address`,
      });
    }

    if (!auctions || !Array.isArray(auctions) || auctions.length === 0) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidParameter,
        message: `CreateAuctionController, Create auction, missing auctions array`,
      });
    }

    if (!liveStreamId) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidLiveStreamId,
        message: `CreateAuctionController, Create auction, missing livestream id`,
      });
    }

    const liveStream = await LiveStream.findById(liveStreamId).lean();
    if (!liveStream || !liveStream.isActive) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeLiveStreamNotFound,
        message: `CreateAuctionController, Create auction, live stream not found or inactive`,
      });
    }

    if (liveStream.userId !== user._id.toString()) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNotAllowed,
        message: `CreateAuctionController, Create auction, streamer is not request user`,
      });
    }

    const conversionRates = await Utils.getConversionRates();

    const auctionsToCreate = [];

    for (const auctionData of auctions) {
      const {
        product = undefined,
        duration = undefined,
        quantity = undefined,
        bidIncrement = undefined,
        counterBidTime = undefined,
        minPrice = {},
        note,
        isSuddenDeath,
        paramsErrorCode = null,
        paramsErrorMsg = null,
      } = await checkParams({ ...auctionData, user, liveStream });

      if (paramsErrorCode) {
        return Base.newErrorResponse({
          response,
          code: paramsErrorCode,
          message: `CreateAuctionController, Create auction, ${paramsErrorMsg}`,
        });
      }

      const valueInSats =
        (minPrice.value / conversionRates.rates[minPrice.currency]) * conversionRates.rates.SAT;
      minPrice.valueInSats = Math.ceil(valueInSats);

      auctionsToCreate.push({
        sellerId: user._id.toString(),
        product: {
          _id: product._id.toString(),
          name: product.name,
          condition: product.condition,
          file: !product.file || product.file.length === 0 ? null : product.file[0],
        },
        liveStreamId,
        duration,
        quantity,
        bidIncrement,
        minPrice,
        counterBidTime,
        softCloseWindow: 10,
        note,
        isSuddenDeath,
      });
    }

    const createdAuctions = await Auction.create(auctionsToCreate);

    const auctionIds = [];
    for (let i = 0; i < createdAuctions.length; i++) {
      auctionIds.push(createdAuctions[i]._id.toString());
      createdAuctions[i] = createdAuctions[i].toObject();
    }

    await LiveStream.findByIdAndUpdate(liveStreamId, {
      $push: { auctionIds: { $each: auctionIds } },
    });

    const responseData = { auctions: createdAuctions };
    Base.successResponse(response, Const.responsecodeSucceed, responseData);

    for (const auction of createdAuctions) {
      socketApi.auctions.emitAll("auctionCreated", {
        auctionId: auction._id.toString(),
        liveStreamId,
        auctionData: auction,
      });
    }

    sendPushNotifications({ liveStream, user });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "CreateAuctionController, Create auction",
      error,
    });
  }
});

async function checkParams({
  productId = undefined,
  duration = undefined,
  quantity = undefined,
  bidIncrement = undefined,
  counterBidTime = undefined,
  minPrice = undefined,
  note = undefined,
  isSuddenDeath,
  user,
  liveStream,
}) {
  if (!productId) {
    return { paramsErrorCode: Const.responsecodeNoProductId, paramsErrorMsg: "missing product id" };
  }

  const product = await Product.findById(productId).lean();
  if (!product) {
    return {
      paramsErrorCode: Const.responsecodeProductNotFound,
      paramsErrorMsg: "product not found",
    };
  }
  if (product.ownerId !== user._id.toString()) {
    return {
      paramsErrorCode: Const.responsecodeNotProductOwner,
      paramsErrorMsg: "product owner is not request user",
    };
  }

  if (!liveStream.linkedProductIds.includes(productId)) {
    return {
      paramsErrorCode: Const.responsecodeLinkedProductNotFound,
      paramsErrorMsg: "product not in live stream linked products",
    };
  }

  if (!duration) {
    duration = 30;
  }
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

  if (!counterBidTime) {
    counterBidTime = 10;
  }
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

  if (!quantity) {
    quantity = 1;
  }
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

  if (!bidIncrement) {
    bidIncrement = 1;
  }
  if (typeof bidIncrement !== "number" || bidIncrement.toString().includes(".")) {
    return {
      paramsErrorCode: Const.responsecodeInvalidBidIncrement,
      paramsErrorMsg: "invalid bid increment: " + bidIncrement,
    };
  }

  if (!minPrice || !minPrice.value || !minPrice.countryCode || !minPrice.currency) {
    return {
      paramsErrorCode: Const.responsecodeInvalidMinPrice,
      paramsErrorMsg: "invalid min price",
    };
  }

  if (!note || typeof note !== "string") {
    note = "";
  }

  if (isSuddenDeath === undefined || typeof isSuddenDeath !== "boolean") {
    isSuddenDeath = false;
  }

  return {
    product,
    duration,
    quantity,
    bidIncrement,
    minPrice,
    counterBidTime,
    note,
    isSuddenDeath,
    liveStream,
  };
}

async function sendPushNotifications({ liveStream, user }) {
  try {
    const userId = user._id.toString();

    const { pushTokens } = await getNotificationReceivers({ liveStream, userId });

    if (pushTokens.length > 0) {
      await Utils.sendPushNotifications({
        pushTokens,
        pushType: Const.pushTypeNewLiveStream,
        info: {
          title: `${user.userName} has live auctions!`,
          liveStream,
        },
      });
    }
  } catch (error) {
    logger.error("CreateAuctionController, sendPushNotifications", error);
  }
}

async function getNotificationReceivers({ liveStream, userId }) {
  const { visibility, tribeIds, communityIds, cohosts: cohostIds = [] } = liveStream;

  let chatReceivers = [],
    pushTokens = [],
    notificationListReceiversIds = [];

  if (visibility === "public") {
    const followers = await User.find({
      followedBusinesses: userId,
      "isDeleted.value": false,
    }).lean();

    for (const follower of followers) {
      const id = follower._id.toString();

      if (follower.pushToken && !cohostIds.includes(id)) {
        pushTokens.push(...follower.pushToken);

        notificationListReceiversIds.push(id);
      }
    }
  }

  if (visibility === "tribes") {
    const tribes = await Tribe.find({ _id: { $in: tribeIds } }).lean();
    let memberIds = [];

    for (const tribe of tribes) {
      const {
        members: { accepted },
      } = tribe;

      for (const member of accepted) {
        if (member.id && !cohostIds.includes(member.id)) {
          memberIds.push(member.id);

          notificationListReceiversIds.push(member.id);
        }
      }
    }

    chatReceivers = await User.find({ _id: { $in: memberIds }, "isDeleted.value": false }).lean();

    for (const receiver of chatReceivers) {
      if (receiver.pushToken) {
        pushTokens.push(...receiver.pushToken);
      }
    }
  }

  if (visibility === "community") {
    chatReceivers = await User.find({
      _id: { $nin: cohostIds },
      "memberships.id": { $in: communityIds },
      "isDeleted.value": false,
    }).lean();

    for (const receiver of chatReceivers) {
      if (receiver.pushToken) {
        pushTokens.push(...receiver.pushToken);
      }

      notificationListReceiversIds.push(receiver._id.toString());
    }
  }

  if (cohostIds.length > 0) {
    const cohosts = await User.find({ _id: { $in: cohostIds }, "isDeleted.value": false }).lean();

    for (const cohost of cohosts) {
      if (cohost.pushToken) {
        pushTokens.push(...cohost.pushToken);
      }

      chatReceivers.push(cohost);
      notificationListReceiversIds.push(cohost._id.toString());
    }
  }

  return { chatReceivers, pushTokens, notificationListReceiversIds };
}

module.exports = router;
