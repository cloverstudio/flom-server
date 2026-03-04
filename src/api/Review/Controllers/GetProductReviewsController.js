"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { Product, Review, User } = require("#models");
const { isUserAllowedToLeaveReview } = require("../helpers");

/**
 * @api {post} /api/v2/review/product Get Product Reviews
 * @apiVersion 2.0.9
 * @apiName Get Product Reviews
 * @apiGroup WebAPI Review
 * @apiDescription Get Product Reviews. If product is marketplace product (type 5) and user already added review to this product then response
 * will contain myReview.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {String} productId Id of the product
 *
 * @apiSuccessExample Success Response
 * {
 *   "code": 1,
 *   "time": 1634907386369,
 *   "data": {
 *     "reviews": [
 *       {
 *         "_id": "617159a19f6f1a03b53fc4d2",
 *         "type": 1,
 *         "created": 1634818465769,
 *         "modified": 1633003682495, // Exists only if review has been modified
 *         "files": [],
 *         "product_id": "5f158464552d4627382e297b",
 *         "user_id": "6101140dcbf8f756d06168fd",
 *         "rate": 2,
 *         "comment": "Ehhh lako",
 *         "owner": {
 *           "_id": "6101140dcbf8f756d06168fd",
 *           "name": "ivo p",
 *           "phoneNumber": "+385976376676",
 *           "avatar": {
 *             "picture": {
 *               "originalName": "imageA_1632133568.jpg",
 *               "size": 853945,
 *               "mimeType": "image/png",
 *               "nameOnServer": "skZMcILQL3zYIgw9yH4QkfjEQLthsTLT"
 *             },
 *             "thumbnail": {
 *               "originalName": "imageA_1632133568.jpg",
 *               "size": 104000,
 *               "mimeType": "image/png",
 *               "nameOnServer": "bj1RyVCmEXA9o4UrT8MzZB4oBwR3mLzB"
 *             }
 *           }
 *         }
 *       },
 *       {
 *         "_id": "5f205d637ee0cf3a62cbf4db",
 *         "product_id": "5f158464552d4627382e297b",
 *         "user_id": "5f1584a8552d4627382e297d",
 *         "created": 1596091528286,
 *         "rate": 4,
 *         "comment": "Very good quality"
 *       }
 *     ],
 *     "myReview": { //only for product type 5
 *       "_id": "617159a19f6f1a03b53fc4d2",
 *       "type": 1,
 *       "created": 1634818465769,
 *       "files": [],
 *       "product_id": "5f158464552d4627382e297b",
 *       "user_id": "6101140dcbf8f756d06168fd",
 *       "rate": 2,
 *       "comment": "Ehhh lako"
 *     },
 *     "canWriteReview": 1, // 0 or 1 depending on can user write a review
 *     "hasNext": false,
 *     "countResult": 1
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 400160 Product not found
 * @apiError (Errors) 400310 No productId parameter
 * @apiError (Errors) 4000007 Token not valid
 */

router.post("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const product_id = request.body.productId;
    const page = request.body.page ? request.body.page : 1;
    const skip = page > 0 ? (page - 1) * Const.pagingRows : 0;

    if (!product_id) {
      return Base.successResponse(response, Const.responsecodeNoProductId);
    }

    const product = await Product.findOne({ _id: product_id, isDeleted: false }).lean();
    if (!product) {
      return Base.successResponse(response, Const.responsecodeProductNotFound);
    }

    const requestUserId = request.user._id.toString();
    let canWriteReview = 0;
    if (
      await isUserAllowedToLeaveReview({
        userId: requestUserId,
        userMemberships: request.user.memberships || [],
        productId: product_id,
        ownerId: product.ownerId,
        productType: product.type,
        allowPublicComments: product.allowPublicComments,
      })
    ) {
      canWriteReview = 1;
    }

    const blocked = request.user.blocked || [];

    var allProductReviews = await Review.find({
      product_id,
      isDeleted: false,
      user_id: { $nin: blocked },
    })
      .sort({ created: -1 })
      .limit(Const.pagingRows)
      .skip(skip)
      .lean();

    var reviewOwnersId = allProductReviews.map((review) => review.user_id);
    reviewOwnersId = reviewOwnersId.filter((review) => review !== "guest");

    const reviewOwners = await User.find(
      { _id: { $in: reviewOwnersId } },
      {
        _id: 1,
        name: 1,
        phoneNumber: 1,
        avatar: 1,
      },
    ).lean();

    const countResult = product.numberOfReviews;
    const reviewOwnersObj = {};

    reviewOwners.forEach((owner) => {
      reviewOwnersObj[owner._id] = owner;
    });

    for (let i = 0; i < allProductReviews.length; i++) {
      if (allProductReviews[i].user_id === "guest") {
        allProductReviews[i].owner = { _id: "guest", name: "Guest", phoneNumber: "Guest" };
      } else {
        allProductReviews[i].owner = reviewOwnersObj[allProductReviews[i].user_id];
      }
      delete allProductReviews[i].__v;
    }

    let myReview;
    if (product.type === Const.productTypeProduct) {
      myReview = await Review.findOne({
        product_id,
        user_id: requestUserId,
        isDeleted: false,
      }).lean();
      if (myReview) {
        delete myReview.__v;
      }
    }

    const dataToSend = {
      reviews: allProductReviews,
      myReview,
      canWriteReview,
      hasNext: page * Const.pagingRows < countResult,
      countResult,
    };

    Base.successResponse(response, Const.responsecodeSucceed, dataToSend);
  } catch (e) {
    Base.errorResponse(response, Const.httpCodeServerError, "GetProductReviewsController", e);
    return;
  }
});

module.exports = router;
