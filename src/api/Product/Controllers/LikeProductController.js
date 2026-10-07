"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { Product, User, Transfer } = require("#models");
const Logics = require("#logics");
const { recombee } = require("#services");
const { sendBonus } = require("#logics");

/**
 * @api {get} /api/v2/product/like Get Liked Products
 * @apiVersion 2.0.7
 * @apiName Get Liked Products
 * @apiGroup WebAPI Products
 * @apiDescription Get Liked Products
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 *
 * @apiSuccessExample Success-Response:
 * {
 *   "code": 1,
 *   "time": 1540989079012,
 *   "data": {
 *     "likedProducts": [
 *       "5cd27ca543ed18722efe6efa"
 *     ]
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 400600 Product, wrong production Id format
 * @apiError (Errors) 4000007 Token not valid
 */

router.get("/", auth({ allowUser: true }), async function (request, response) {
  try {
    let dataToSend = {};
    dataToSend.likedProducts = [];

    if (request.user.likedProducts) dataToSend.likedProducts = request.user.likedProducts;

    Base.successResponse(response, Const.responsecodeSucceed, dataToSend);
  } catch (error) {
    if (error.name == "CastError") {
      return Base.errorResponse({
        response,
        code: Const.responsecodeProductWrongProductIdFormat,
        message: "LikeProductController, GET, wrong product id format",
      });
    }
    Base.errorResponse({
      response,
      message: "LikeProductController, GET",
      error,
    });
  }
});

/**
 * @api {post} /api/v2/product/like/add Like Product By Id
 * @apiVersion 2.0.7
 * @apiName Like Product By Id
 * @apiGroup WebAPI Products
 * @apiDescription Like Product By Id. If product is from Recombee recommendation send the recommId as well.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {String} productId productId
 * @apiParam {String} [recommId] recommId
 *
 * @apiSuccessExample Success-Response:
 * {
 *   "code": 1,
 *   "time": 1540989079012,
 *   "data": {}
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 400510 No productId
 * @apiError (Errors) 400600 Product, wrong production Id format
 * @apiError (Errors) 4000007 Token not valid
 * @apiError (Errors) 4000780 Product already liked
 */

router.post("/add", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;

    const productId = request.body.productId;
    const recommId = request.body.recommId ?? null;

    if (!productId) {
      return Base.errorResponse({
        response,
        code: Const.responsecodeProductNoProductId,
        message: "LikeProductController, Add like, no product id",
      });
    }

    const product = await Product.findOne({ _id: productId, isDeleted: false }).lean();

    if (!product) {
      return Base.errorResponse({
        response,
        code: Const.responsecodeProductNotFound,
        message: "LikeProductController, Add like, product not found",
      });
    }

    // check if product is already liked
    let likedProducts = [];

    if (request.user.likedProducts) likedProducts = request.user.likedProducts;
    const index = likedProducts.indexOf(productId);

    if (index > -1) {
      return Base.errorResponse({
        response,
        code: Const.responsecodeProductAlreadyLiked,
        message: "LikeProductController, Add like, product already liked",
      });
    }

    await User.findByIdAndUpdate(request.user._id, {
      $push: { likedProducts: productId },
    });

    //update product number of likes
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { $inc: { numberOfLikes: 1 } },
      { new: true, lean: true },
    );

    Base.successResponse(response, Const.responsecodeSucceed);

    try {
      await sendBonus({
        userId: user._id.toString(),
        bonusType: Const.bonusTypeLike,
        productId,
        productName: product.name,
        ownerId: product.ownerId,
      });

      if (updatedProduct.numberOfLikes >= Const.highEngagementContentThreshold) {
        const bonusTransfer = await Transfer.findOne({
          receiverId: updatedProduct.ownerId,
          bonusType: Const.bonusTypeHighEngagementContent,
        }).lean();

        if (!bonusTransfer) {
          await sendBonus({
            userId: updatedProduct.ownerId,
            bonusType: Const.bonusTypeHighEngagementContent,
            productId,
            productName: updatedProduct.name,
            ownerId: updatedProduct.ownerId,
          });
        }
      }
    } catch (error) {
      logger.error("LikeProductController, Add like, sending bonus", error);
    }

    try {
      await recombee.recordInteraction({
        user: request.user,
        product: updatedProduct,
        type: "like",
        recommId,
      });
    } catch (error) {
      logger.error("LikeProductController, Add like, recombee", error);
    }

    Logics.addUserCategoryInteraction({ product, user });
    Logics.addUserTagInteraction({ product, user });
  } catch (error) {
    if (error.name == "CastError") {
      return Base.errorResponse({
        response,
        code: Const.responsecodeProductWrongProductIdFormat,
        message: "LikeProductController, Add like, wrong product id format",
      });
    }
    Base.errorResponse({
      response,
      message: "LikeProductController, Add like",
      error,
    });
  }
});

/**
 * @api {post} /api/v2/product/like/remove Dislike Product By Id
 * @apiVersion 2.0.7
 * @apiName Dislike Product By Id
 * @apiGroup WebAPI Products
 * @apiDescription Dislike Product By Id
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {String} productId productId
 *
 * @apiSuccessExample Success-Response:
 * {
 *   "code": 1,
 *   "time": 1540989079012,
 *   "data": {}
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 400510 No productId
 * @apiError (Errors) 400790 Product not liked
 * @apiError (Errors) 400800 Product not disliked
 * @apiError (Errors) 400600 Product, wrong production Id format
 * @apiError (Errors) 4000007 Token not valid
 **/

router.post("/remove", auth({ allowUser: true }), async function (request, response) {
  try {
    const productId = request.body.productId;

    if (!productId) {
      return Base.errorResponse({
        response,
        code: Const.responsecodeProductNoProductId,
        message: "LikeProductController, dislike, no product id",
      });
    }

    const product = await Product.findOne({ _id: productId }).exec();

    if (!product) {
      return Base.errorResponse({
        response,
        code: Const.responsecodeProductNotFound,
        message: "LikeProductController, dislike, product not found",
      });
    }

    let likedProducts = [];

    if (request.user.likedProducts) likedProducts = request.user.likedProducts;

    if (!likedProducts.includes(productId)) {
      return Base.errorResponse({
        response,
        code: Const.responsecodeProductNotLiked,
        message: "LikeProductController, dislike, product not liked",
      });
    }

    likedProducts = likedProducts.filter((id) => id !== productId);

    await User.findByIdAndUpdate(request.user._id, {
      $set: { likedProducts: likedProducts },
    });

    //update product number of likes
    product.numberOfLikes--;
    await product.save();

    Base.successResponse(response, Const.responsecodeSucceed);

    try {
      await recombee.recordInteraction({
        user: request.user,
        product: product.toObject(),
        type: "unlike",
      });
    } catch (error) {
      logger.error("LikeProductController, dislike, recombee", error);
    }

    Logics.addUserCategoryInteraction({ product, user: request.user });
    Logics.addUserTagInteraction({ product, user: request.user });
  } catch (error) {
    if (error.name == "CastError") {
      return Base.errorResponse({
        response,
        code: Const.responsecodeProductWrongProductIdFormat,
        message: "LikeProductController, dislike, wrong product id format",
      });
    }
    Base.errorResponse({
      response,
      message: "LikeProductController, dislike",
      error,
    });
  }
});

module.exports = router;
