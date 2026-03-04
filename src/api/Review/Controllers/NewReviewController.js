"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { Product, Review } = require("#models");
const { sendBonus } = require("#logics");
const { recombee } = require("#services");
const { isUserAllowedToLeaveReview } = require("../helpers");
const {
  handleVideoFile,
  handleImageFile,
  handleAudioFile,
  deleteFile,
} = require("../../Product/helpers");

/**
 * @api {post} /api/v2/reviews New Add Review
 * @apiVersion 2.0.9
 * @apiName New Add Review
 * @apiGroup WebAPI Review
 * @apiDescription New API for adding reviews. Accepts files. If product is from Recombee recommendation send the recommId as well.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {String} productId Id of the product
 * @apiParam {String} [recommId] recommId
 * @apiParam {String} [rate] Rate, required only for products (type 5)
 * @apiParam {String} [comment] Comment
 * @apiParam {File} [file0] Review file (audio, video, image). If there are multiple files then subsequent files should be sent as
 * "file1", "file2", etc. Max 1 audio file, videos and pictures don't have limits. Users that have purchased or blessed creator can leave a comment.
 * Temp disabled that functionality for testing purposes.
 *
 * @apiSuccessExample Success Response
 * {
 *   "code": 1,
 *   "time": 1633003682587,
 *   "data": {
 *     "review": {
 *       "created": 1633003682495,
 *       "files": [
 *         {
 *           "file": {
 *             "originalName": "dd1rk1f-1352ef4c-412d-4b4f-88a3-a4b48c54c752.jpg",
 *             "nameOnServer": "Qs2gyPGzaWdHa1j5ZHOxMDGoeRT1FZxZ",
 *             "size": 2384387,
 *             "mimeType": "image/png",
 *             "aspectRatio": 1.77779
 *           },
 *           "thumb": {
 *             "originalName": "dd1rk1f-1352ef4c-412d-4b4f-88a3-a4b48c54c752.jpg",
 *             "nameOnServer": "YaW1vQta1ucX8bnPJnPmYUtDRSgSp1bM",
 *             "mimeType": "image/jpeg",
 *             "size": 168504
 *           },
 *           "_id": "6155a8a2edd164c416ff5487",
 *           "fileType": 0, // 0 - image, 1 - video, 2 - audio
 *           "order": 0
 *         },
 *         {
 *           "file": {
 *             "originalName": "Video.mp4",
 *             "nameOnServer": "pAVtRIDhWBgyJxwY90w2WdrUHX9f1Bzh",
 *             "aspectRatio": 1.77779,
 *             "duration": 7.80001,
 *             "mimeType": "video/mp4",
 *             "size": 2181851,
 *             "hslName": "h2ZHk0A8646EfAv9brKpYdkOog9xr90g"
 *           },
 *           "thumb": {
 *             "originalName": "Video.mp4",
 *             "nameOnServer": "emPDd68Z9VSLnsC2YLmcFSD5tb8uZsQp",
 *             "mimeType": "image/png",
 *             "size": 47243
 *           },
 *           "_id": "6155a8a2edd164c416ff5486",
 *           "fileType": 1,
 *           "order": 1
 *         },
 *         {
 *           "file": {
 *             "originalName": "Fullmetal Alchemist Brotherhood ED3.mp3",
 *             "nameOnServer": "AnyA2ueZYk2Q552LIw0lEK1mBLnfHtRA.mp3",
 *             "mimeType": "audio/mpeg",
 *             "duration": 276.088173,
 *             "size": 6626879
 *           },
 *           "_id": "6155a8a2edd164c416ff5485",
 *           "fileType": 2,
 *           "order": 2
 *         }
 *       ],
 *       "_id": "6155a8a2edd164c416ff5484",
 *       "product_id": "6103e99142fc9813e7110efc",
 *       "user_id": "5f7ee464a283bc433d9d722f",
 *       "rate": 4,
 *       "comment": "Comment"
 *     }
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 400124 Error when handling video file
 * @apiError (Errors) 400160 Product not found
 * @apiError (Errors) 400165 Transaction/transfer not found
 * @apiError (Errors) 400310 No productId parameter
 * @apiError (Errors) 400320 No rate parameter
 * @apiError (Errors) 443225 Invalid productId parameter
 * @apiError (Errors) 443390 Product review already exists
 * @apiError (Errors) 443925 Unverified user not allowed to upload files
 * @apiError (Errors) 4000007 Token not valid
 */

router.post("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const { fields, files } = await Utils.formParse(request);
    const { productId, comment, recommId = null } = fields;
    const rate = +fields.rate;
    const requestUserId = request.user._id.toString();

    if (Object.keys(files).length > 0) {
      if (
        request.user.merchantApplicationStatus !==
          Const.merchantApplicationStatusApprovedWithoutPayout &&
        request.user.merchantApplicationStatus !==
          Const.merchantApplicationStatusApprovedWithPayout &&
        request.user.identityStatus !== Const.identityStatusVerified &&
        (!request.user.bankAccounts ||
          !request.user.bankAccounts.some((account) => account.merchantCode))
      ) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeUnverifiedUserNotAllowedToUploadFiles,
          message: `NewReviewController - add review, unverified user not allowed to upload files in review`,
        });
      }
    }

    if (!productId) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoProductId,
        message: `NewReviewController - add review, no product id`,
      });
    }

    if (!Utils.isValidObjectId(productId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidProductId,
        message: `NewReviewController - add review, productId is not valid`,
      });
    }

    const product = await Product.findOne({ _id: productId, isDeleted: false });
    if (!product) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeProductNotFound,
        message: `NewReviewController - add review, product not found`,
      });
    }
    if (
      !(await isUserAllowedToLeaveReview({
        userId: requestUserId,
        userMemberships: request.user.memberships || [],
        productId,
        ownerId: product.ownerId,
        productType: product.type,
        allowPublicComments: product.allowPublicComments,
      }))
    ) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeTransactionNotFound,
        message: `NewReviewController - add review, transaction/transfer not found`,
      });
    }
    if (product.type === Const.productTypeProduct) {
      if (!rate) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeNoProductRate,
          message: `NewReviewController - add review, no rate`,
        });
      }

      const reviewExists = await Review.findOne({
        product_id: productId,
        user_id: requestUserId,
        isDeleted: false,
      });
      if (reviewExists) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeAlreadyReviewed,
          message: `NewReviewController - add review, review already exists`,
        });
      }

      if (!product.rate) {
        product.rate = +rate;
        product.numberOfReviews = 1;
      } else {
        const aggregation = await Review.aggregate([
          { $match: { product_id: productId, isDeleted: false } },
          {
            $group: {
              _id: null,
              ratesSum: { $sum: "$rate" },
              reviewsCount: { $sum: 1 },
            },
          },
        ]);

        const { ratesSum, reviewsCount } = aggregation[0];
        product.rate = Utils.roundNumber((ratesSum + rate) / (reviewsCount + 1), 4);
        product.numberOfReviews = reviewsCount;
      }
    } else {
      if (!product.numberOfReviews) {
        product.numberOfReviews = 1;
      } else {
        product.numberOfReviews = product.numberOfReviews + 1;
      }
    }
    await product.save();

    let order = 0,
      fileData;
    const allFiles = [],
      fileKeys = Object.keys(files);
    if (fileKeys.length) {
      for (let i = 0; i < fileKeys.length; i++) {
        const file = files[fileKeys[i]];
        const fileMimeType = file.type;

        if (fileMimeType.indexOf("video") !== -1) {
          try {
            fileData = await handleVideoFile(file);
          } catch (error) {
            return Base.newErrorResponse({
              response,
              code: Const.responsecodeErrorWithVideoFile,
              message: `NewReviewController - add review, error with video file`,
              error,
            });
          }
        } else if (fileMimeType.indexOf("image") !== -1) {
          fileData = await handleImageFile(file);
        } else if (fileMimeType.indexOf("audio") !== -1) {
          fileData = await handleAudioFile(file);
        } else {
          logger.error(
            `NewReviewController, add review - invalid file with mime type: ${fileMimeType}`,
          );
          continue;
        }
        fileData.order = order++;
        allFiles.push(fileData);
      }
    }

    const review = await Review.create({
      product_id: productId,
      user_id: requestUserId,
      rate: +rate || undefined,
      comment,
      files: allFiles,
    });

    const { __v, ...reviewObj } = review.toObject();
    Base.successResponse(response, Const.responsecodeSucceed, {
      review: reviewObj,
    });

    try {
      if (product.type !== Const.productTypeProduct && comment) {
        await sendBonus({
          userId: requestUserId,
          bonusType: Const.bonusTypeComment,
          productId,
          productName: product.name,
          ownerId: product.ownerId,
        });
      } else if (product.type === Const.productTypeProduct && rate) {
        await sendBonus({
          userId: requestUserId,
          bonusType: Const.bonusTypeRating,
          productId,
          productName: product.name,
          ownerId: product.ownerId,
        });
      }
    } catch (error) {
      logger.error("NewReviewController, add review, send bonus", error);
    }

    try {
      await recombee.recordInteraction({
        user: request.user,
        product: product.toObject(),
        type: "rating",
        rating: (rate - 3) / 2, // Recombee ratings are from -1 to +1
        recommId,
      });
    } catch (error) {
      logger.error("NewReviewController, add review, recombee", error);
    }
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "NewReviewController - add review",
      error,
    });
  }
});

/**
 * @api {patch} /api/v2/reviews/:reviewId New Update Review
 * @apiVersion 2.0.9
 * @apiName New Update Review
 * @apiGroup WebAPI Review
 * @apiDescription New API for updating reviews. Accepts files. If product is from Recombee recommendation send the recommId as well.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {String} [recommId] recommId
 * @apiParam {String} [rate] Rate of the product. Only available for marketplace products (type 5)
 * @apiParam {String} [comment] Comment
 * @apiParam {String} [filesToDelete] Comma separated list of file ids to delete (e.g. "6155a8a2edd164c416ff5485,6155a8a2edd164c416ff5486")
 * @apiParam {File} [file0] Review file (audio, video, image). If there are multiple files then subsequent files should be sent as
 * "file1", "file2", etc. Max 1 audio file, videos and pictures don't have limits. Uploading audio file will replace current one if it exists.
 *
 * @apiSuccessExample Success Response
 * {
 *   "code": 1,
 *   "time": 1633003682587,
 *   "data": {
 *     "review": {
 *       "created": 1633003682495,
 *       "modified": 1633003682495, //updates every time review is updated
 *       "files": [
 *         {
 *           "file": {
 *             "originalName": "dd1rk1f-1352ef4c-412d-4b4f-88a3-a4b48c54c752.jpg",
 *             "nameOnServer": "Qs2gyPGzaWdHa1j5ZHOxMDGoeRT1FZxZ",
 *             "size": 2384387,
 *             "mimeType": "image/png",
 *             "aspectRatio": 1.77779
 *           },
 *           "thumb": {
 *             "originalName": "dd1rk1f-1352ef4c-412d-4b4f-88a3-a4b48c54c752.jpg",
 *             "nameOnServer": "YaW1vQta1ucX8bnPJnPmYUtDRSgSp1bM",
 *             "mimeType": "image/jpeg",
 *             "size": 168504
 *           },
 *           "_id": "6155a8a2edd164c416ff5487",
 *           "fileType": 0, // 0 - image, 1 - video, 2 - audio
 *           "order": 0
 *         },
 *         {
 *           "file": {
 *             "originalName": "Video.mp4",
 *             "nameOnServer": "pAVtRIDhWBgyJxwY90w2WdrUHX9f1Bzh",
 *             "aspectRatio": 1.77779,
 *             "duration": 7.80001,
 *             "mimeType": "video/mp4",
 *             "size": 2181851,
 *             "hslName": "h2ZHk0A8646EfAv9brKpYdkOog9xr90g"
 *           },
 *           "thumb": {
 *             "originalName": "Video.mp4",
 *             "nameOnServer": "emPDd68Z9VSLnsC2YLmcFSD5tb8uZsQp",
 *             "mimeType": "image/png",
 *             "size": 47243
 *           },
 *           "_id": "6155a8a2edd164c416ff5486",
 *           "fileType": 1,
 *           "order": 1
 *         },
 *         {
 *           "file": {
 *             "originalName": "Fullmetal Alchemist Brotherhood ED3.mp3",
 *             "nameOnServer": "AnyA2ueZYk2Q552LIw0lEK1mBLnfHtRA.mp3",
 *             "mimeType": "audio/mpeg",
 *             "duration": 276.088173,
 *             "size": 6626879
 *           },
 *           "_id": "6155a8a2edd164c416ff5485",
 *           "fileType": 2,
 *           "order": 2
 *         }
 *       ],
 *       "_id": "6155a8a2edd164c416ff5484",
 *       "product_id": "6103e99142fc9813e7110efc",
 *       "user_id": "5f7ee464a283bc433d9d722f",
 *       "rate": 4,
 *       "comment": "Comment"
 *     }
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 400124 Error when handling video file
 * @apiError (Errors) 400160 Product not found
 * @apiError (Errors) 443392 Invalid reviewId
 * @apiError (Errors) 443393 Review not found
 * @apiError (Errors) 443394 Editing review forbidden. You can only edit your own reviews and reviews that are not super bless reviews
 * @apiError (Errors) 443395 Error when parsing the filesToDelete parameter
 * @apiError (Errors) 4000007 Token not valid
 */

router.patch("/:reviewId", auth({ allowUser: true }), async function (request, response) {
  try {
    const { reviewId } = request.params;
    const { fields, files } = await Utils.formParse(request);
    const { comment, recommId = null } = fields;
    const rate = +fields.rate;
    const { _id: requestUserId } = request.user;
    let isModified = false;

    if (!Utils.isValidObjectId(reviewId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidReviewId,
        message: `NewReviewController - update review, reviewId is not valid`,
      });
    }

    const review = await Review.findOne({ _id: reviewId, isDeleted: false });
    if (!review) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeReviewNotFound,
        message: `NewReviewController - update review, review not found`,
      });
    }

    if (
      review.user_id !== requestUserId.toString() ||
      review.type === Const.reviewTypeBless ||
      review.type === Const.reviewTypeSpray
    ) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeReviewEditForbidden,
        message: `NewReviewController - update review, edit forbidden`,
      });
    }

    if (rate && rate >= 1 && rate <= 5 && review.rate && rate !== review.rate) {
      const product = await Product.findOne({ _id: review.product_id, isDeleted: false });
      if (!product) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeProductNotFound,
          message: `NewReviewController - update review, product not found`,
        });
      }
      product.rate = Utils.roundNumber(
        (product.rate * product.numberOfReviews - review.rate + rate) / product.numberOfReviews,
        4,
      );
      review.rate = rate;
      await product.save();
      isModified = true;

      try {
        await recombee.recordInteraction({
          user: request.user,
          product: product.toObject(),
          type: "rating",
          rating: (rate - 3) / 2, // Recombee ratings are from -1 to +1
          recommId,
        });
      } catch (error) {
        logger.error("NewReviewController, update review, recombee", error);
      }
    }

    if (comment || comment === "") {
      review.comment = comment;
      isModified = true;
    }

    if (fields.filesToDelete) {
      const filesToDelete = fields.filesToDelete.split(",");
      const filesIdsToDeleteObj = filesToDelete.reduce((acc, cur) => {
        acc[cur] = true;
        return acc;
      }, {});

      let order = 0;
      const oldReviewFiles = review.files.map((file) => file.toObject());
      const newReviewFiles = [];
      for (i = 0; i < oldReviewFiles.length; i++) {
        const currentFile = oldReviewFiles[i];
        const currentFileId = currentFile._id.toString();
        if (!filesIdsToDeleteObj[currentFileId]) {
          currentFile.order = order;
          newReviewFiles.push(currentFile);
          order++;
        } else {
          await deleteFile(currentFile);
        }
      }
      review.files = newReviewFiles;
      review.markModified("files");
      isModified = true;
    }

    const fileKeys = Object.keys(files);
    if (fileKeys.length) {
      let fileData;
      let order = review.files?.length ? review.files[review.files.length - 1].order + 1 : 0;
      for (let i = 0; i < fileKeys.length; i++) {
        const file = files[fileKeys[i]];
        const fileMimeType = file.type;

        if (fileMimeType.indexOf("video") !== -1) {
          try {
            fileData = await handleVideoFile(file);
          } catch (error) {
            return Base.newErrorResponse({
              response,
              code: Const.responsecodeErrorWithVideoFile,
              message: `NewReviewController - update review, error with video file`,
              error,
            });
          }
        } else if (fileMimeType.indexOf("image") !== -1) {
          fileData = await handleImageFile(file);
        } else if (fileMimeType.indexOf("audio") !== -1) {
          fileData = await handleAudioFile(file);
        } else {
          logger.error(
            `NewReviewController, update review - invalid file with mime type: ${fileMimeType}`,
          );
          continue;
        }
        fileData.order = order++;
        review.files.push(fileData);
      }
      review.markModified("files");
      isModified = true;
    }

    if (isModified) {
      review.modified = Date.now();
    }

    await review.save();

    const { __v, ...reviewObj } = review.toObject();
    Base.successResponse(response, Const.responsecodeSucceed, {
      review: reviewObj,
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "NewReviewController - update review",
      error,
    });
  }
});

module.exports = router;
