"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const, Config } = require("#config");
const { auth } = require("#middleware");
const { Product, LiveStream } = require("#models");
const { sendBonus } = require("#logics");
const { recombee } = require("#services");

/**
 * @api {post} /api/v2/user/content-engagement User content engagement flom_v1
 * @apiVersion 2.0.25
 * @apiName User content engagement flom_v1
 * @apiGroup WebAPI User
 * @apiDescription  API to notify app of user passing content engagement thresholds (video, audio, livestream).
 * Send one of productId or liveStreamId. Relevant parameter (watchTime, completion) is mandatory for its engagementType.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiParam {String}  engagementType   Type of engagement: "watchTime", "completion"
 * @apiParam {String}  [watchTime]      Watch/listen time thresholds: "full", "5min". ONLY FOR DEV: "30sec"
 * @apiParam {Number}  [completion]     Completion thresholds: 25%, 50%, 75%, 100%. Send as whole numbers: 25, 50, 75, 100. ONLY FOR DEV: 5 (5%)
 * @apiParam {String}  [productId]      Id of product (video or audio) (market, story and expo forbidden)
 * @apiParam {String}  [liveStreamId]   Id of liveStream
 * @apiParam {String}  [recommId]       Id of recombee recommendation from which the product/livestream has been selected/watched.
 *
 * @apiSuccessExample Success Response
 * {
 *   "code": 1,
 *   "time": 1507293117920,
 *   "data": {}
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443921 Invalid watch time
 * @apiError (Errors) 443922 No content id
 * @apiError (Errors) 443225 Invalid product id
 * @apiError (Errors) 443863 Invalid live stream id
 * @apiError (Errors) 400160 Product not found
 * @apiError (Errors) 443855 Live stream not found
 * @apiError (Errors) 443890 Invalid product type
 * @apiError (Errors) 443924 Content too short for watch time
 * @apiError (Errors) 4000007 Token invalid
 */

router.post("/", auth({ allowUser: true }), async function (request, response) {
  Base.successResponse(response, Const.responsecodeSucceed);

  try {
    const { user } = request;
    const {
      engagementType,
      watchTime,
      completion,
      productId,
      liveStreamId,
      recommId = null,
    } = request.body;

    if (engagementType === "watchTime") {
      if (!watchTime || !["full", "5min", "30sec"].includes(watchTime)) {
        throw new Error("invalid watch time: " + watchTime);
      }
      if (watchTime === "30sec" && Config.environment === "production") {
        throw new Error("invalid watch time: " + watchTime);
      }
    } else if (engagementType === "completion") {
      if (!completion || ![5, 25, 50, 75, 100].includes(completion)) {
        throw new Error("invalid completion: " + completion);
      }
      if (completion === 5 && Config.environment === "production") {
        throw new Error("invalid completion: " + completion);
      }
    } else {
      throw new Error("invalid engagementType: " + engagementType);
    }

    if (!productId && !liveStreamId) {
      throw new Error("no content id");
    }

    const model = liveStreamId ? LiveStream : Product;
    const targetId = productId || liveStreamId;
    const content = await model.findById(targetId).lean();
    if (!content) {
      throw new Error((liveStreamId ? "live stream not found" : "product not found") + targetId);
    }

    if (
      productId &&
      [Const.productTypeProduct, Const.productTypeTextStory].includes(content.type)
    ) {
      throw new Error("invalid product type: " + content.type);
    }

    if (productId && engagementType === "watchTime") {
      let duration = null;

      const { file: files = [] } = content;
      for (const file of files) {
        if (file.file.mimeType.includes("video") || file.file.mimeType.includes("audio")) {
          duration = file.file?.duration || null;
        }
      }

      if (!duration) {
        throw new Error("duration not found");
      }

      if ((watchTime === "5min" || watchTime === "30sec") && duration < 603) {
        throw new Error("content too short: " + duration);
      }
    }

    if (engagementType === "completion") {
      let rating = 0;

      switch (completion) {
        case 5:
        case 25:
          rating = 0.25;
          break;
        case 50:
          rating = 0.5;
          break;
        case 75:
          rating = 0.75;
          break;
        case 100:
          rating = 1;
          break;
        default:
          throw new Error("invalid completion: " + completion);
      }

      await recombee.recordInteraction({
        user,
        ...(!liveStreamId ? { product: content } : { liveStream: content }),
        type: "rating",
        rating,
        recommId,
      });
    }

    if (engagementType === "watchTime") {
      const bonusRequest = {
        userId: user._id.toString(),
        bonusType:
          watchTime === "full" ? Const.bonusTypePlayingFullContent : Const.bonusTypePlaying5Minutes,
        liveStreamId,
        productId,
        productName: content.name,
        liveStreamName: content.name,
        ownerId: content.ownerId ?? content.userId,
      };

      await sendBonus(bonusRequest);
    }
  } catch (error) {
    logger.error("UserContentEngagementController", error);
  }
});

module.exports = router;
